import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { User } from './entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject('TASKS_EVENTS_SERVICE') private readonly rabbitClient: ClientProxy,
  ) { }

  /**
   * Método helper para VERIFICAR E CARREGAR entidades "espelho" de usuários.
   * Ele não cria usuários, apenas valida se os IDs existem.
   */
  private async preloadAssignees(assigneeIds: string[]): Promise<User[]> {
    // Usa o operador 'In' para buscar todos os usuários com IDs da lista
    const users = await this.userRepository.findBy({
      id: In(assigneeIds),
    });

    // Verifica se todos os IDs enviados foram encontrados
    if (users.length !== assigneeIds.length) {
      const foundIds = users.map(u => u.id);
      const notFoundIds = assigneeIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Usuário(s) não encontrado(s): ${notFoundIds.join(', ')}`);
    }

    return users;
  }

  /*
   * Cria uma nova tarefa.
   * @param createTaskDto - Os dados da tarefa a ser criada.
   * @param ownerId - O ID do usuário que está criando a tarefa (virá do token JWT).
   */
  async createTask(createTaskDto: CreateTaskDto, ownerId: string, ownerUsername: string): Promise<Task> {
    // Pega os assigneeIds de dentro do DTO
    const { assigneeIds, ...taskData } = createTaskDto;

    let assignees: User[] = [];
    if (assigneeIds && assigneeIds.length > 0) {
      // Se o cliente enviou IDs, carrega as entidades User
      assignees = await this.preloadAssignees(assigneeIds);
    }

    const task = this.taskRepository.create({
      ...taskData,
      ownerId,
      ownerUsername,
      assignees, // Passa o array de entidades User para o TypeORM
    });

    const savedTask = await this.taskRepository.save(task)

    // Envia o evento para o RabbitMQ
    this.rabbitClient.emit('task_created', savedTask);

    return savedTask;
  }

  async findAllTasksByUserId(
    userId: string,
    page: number = 1, // Valor padrão
    size: number = 10, // Valor padrão
    search?: string,
  ) {
    // Calcula os parâmetros de paginação
    const skip = (page - 1) * size; // Pular (ex: página 2, size 10 -> pular 10)
    const take = size; // Pegar (ex: 10 itens)

    // Cria a condição de busca (WHERE ... LIKE ...)
    // Se 'search' foi fornecido, cria um objeto de condição para o título
    const searchCondition = search ? { title: ILike(`%${search}%`) } : {};

    // Cria as condições de permissão (WHERE ... OR ...)
    // "Onde o usuário é o dono E o título bate com a busca"
    // "OU onde o usuário é um assignee E o título bate com a busca"
    const whereConditions = [
      { ownerId: userId, ...searchCondition },
      { assignees: { id: userId }, ...searchCondition },
    ];

    // Executa a query com findAndCount
    // Isso é super eficiente: faz duas queries em uma (busca os dados E conta o total)
    const [data, total] = await this.taskRepository.findAndCount({
      where: whereConditions,
      relations: {
        assignees: true,
        comments: true,
      },
      order: { createdAt: 'DESC' },
      skip: skip,
      take: take,
    });

    // Retorna os dados em um formato amigável para paginação
    return {
      data,        // Os itens da página atual
      total,       // O número total de itens que correspondem à busca
      page,        // A página atual
      size,        // O tamanho da página
      totalPages: Math.ceil(total / size), // O número total de páginas
    };
  }

  async findTaskById(id: string, userId: string): Promise<Task> {
    // Busca a tarefa pelo ID, já incluindo as relações
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        assignees: true,
        comments: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    const isOwner = task.ownerId === userId;
    const isAssignee = task.assignees.some(user => user.id === userId);

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('Você não tem permissão para acessar esta tarefa.');
    }

    return task;
  }

  async updateTask(id: string, ownerId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {

   const { assigneeIds, ...taskData } = updateTaskDto;

   const task = await this.findTaskById(id, ownerId);

   // Mescla e SALVA os dados simples (title, description, status, etc.)
   // Isso atualiza a tabela 'tasks'.
   if (Object.keys(taskData).length > 0) {
     this.taskRepository.merge(task, taskData);
     await this.taskRepository.save(task);
   }

   // Verificamos se 'assigneeIds' foi realmente enviado no DTO.
   if (Object.prototype.hasOwnProperty.call(updateTaskDto, 'assigneeIds')) {
     let newAssignees: User[] = [];
     if (assigneeIds && assigneeIds.length > 0) {
       // Busca as entidades User para os novos IDs
       newAssignees = await this.preloadAssignees(assigneeIds);
     }

     // 'task.assignees' aqui contém a lista ANTIGA de assignees (carregada pelo findOneById).
     const oldAssignees = task.assignees || [];

     // O RelationQueryBuilder é a forma 100% correta de atualizar uma ManyToMany.
     // Ele calcula a diferença (diff) e faz os INSERTS/DELETES necessários na tabela de junção.
     await this.taskRepository
       .createQueryBuilder()
       .relation(Task, 'assignees') // Queremos modificar a relação 'assignees' da entidade Task
       .of(task) // Para esta 'task' específica
       .addAndRemove(newAssignees, oldAssignees); // Substitui a lista antiga pela nova
   }

   // Busca a tarefa novamente para garantir que temos os dados mais recentes
   // (com as relações atualizadas) para enviar ao RabbitMQ.
   const updatedTask = await this.findTaskById(id, ownerId);
   
   this.rabbitClient.emit('task_updated', updatedTask);

   return updatedTask;
 }


  async deleteTask(id: string, ownerId: string): Promise<Task> {
    const task = await this.findTaskById(id, ownerId);

    await this.taskRepository.remove(task);

    return task;
  }

  // Comentários
  async addComment(taskId: string, authorId: string, authorUsername: string, content: string): Promise<Comment> {
    // Primeiro, verifica se a tarefa existe.
    const task = await this.taskRepository.findOneBy({ id: taskId });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${taskId}" não encontrada.`);
    }

    const newComment = this.commentRepository.create({
      content,
      authorId,
      authorUsername,
      task, // O TypeORM é inteligente o suficiente para associar a tarefa aqui
    });

    const savedComment = await this.commentRepository.save(newComment);

    this.rabbitClient.emit('comment_created', savedComment);

    return savedComment;
  }

  async findCommentsByTask(
    taskId: string,
    userId: string,
    page: number = 1, // Valor padrão
    size: number = 5,  // Padrão de 5 comentários por página
  ) {
    // Busca a tarefa pelo ID para verificar a permissão
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: { assignees: true }, // Só precisamos dos assignees para a verificação
    });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${taskId}" não encontrada.`);
    }

    // VERIFICAÇÃO DE PERMISSÃO
    const isOwner = task.ownerId === userId;
    const isAssignee = task.assignees.some(user => user.id === userId);

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('Você não tem permissão para ver os comentários desta tarefa.');
    }

    // LÓGICA DE PAGINAÇÃO PARA OS COMENTÁRIOS
    const skip = (page - 1) * size;
    const take = size;

    const [data, total] = await this.commentRepository.findAndCount({
      where: { task: { id: taskId } }, // Filtra comentários para esta tarefa
      order: { createdAt: 'DESC' }, // Mais recentes primeiro
      skip: skip,
      take: take,
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }


}