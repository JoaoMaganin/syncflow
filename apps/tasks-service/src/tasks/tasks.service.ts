import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { User } from './entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TaskHistory } from './entities/task-history.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(TaskHistory)
    private readonly taskHistoryRepository: Repository<TaskHistory>,

    @Inject('TASKS_EVENTS_SERVICE') private readonly rabbitClient: ClientProxy,
  ) { }

  // Funções de audit log
  private async createAuditLog(
    task: Task,
    userId: string,
    username: string,
    action: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    const historyLog = this.taskHistoryRepository.create({
      task,
      userId,
      username,
      action,
      oldValue: oldValue || null,
      newValue: newValue || null,
    });
    await this.taskHistoryRepository.save(historyLog);
  }


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

    // log de auditoria
    await this.createAuditLog(
      savedTask,
      ownerId,
      ownerUsername,
      'TASK_CREATED', // Ação
      null,
      savedTask.title, // Salva o título da tarefa como 'newValue'
    );

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
        history: true,
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
        history: true,
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

  // async updateTask(id: string, user: { userId: string, username: string }, ownerId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
  //   const { assigneeIds, ...taskData } = updateTaskDto;

  //   // Buscamos a tarefa ANTIGA, incluindo suas relações
  //   const taskBeforeUpdate = await this.findTaskById(id, ownerId);

  //   // Criamos uma cópia do estado antigo para comparar depois
  //   const oldStatus = taskBeforeUpdate.status;
  //   const oldPriority = taskBeforeUpdate.priority;
  //   const oldAssignees = [...taskBeforeUpdate.assignees];

  //   // Mescla e salva os dados simples (title, description, status, etc.)
  //   this.taskRepository.merge(taskBeforeUpdate, taskData);

  //   // Lida com a lógica da relação 'assignees'
  //   if (assigneeIds) {
  //     if (assigneeIds.length > 0) {
  //       taskBeforeUpdate.assignees = await this.preloadAssignees(assigneeIds);
  //     } else {
  //       taskBeforeUpdate.assignees = [];
  //     }
  //   }

  //   // Salva a entidade atualizada
  //   const updatedTask = await this.taskRepository.save(taskBeforeUpdate);

  //   // --- LÓGICA DE AUDITORIA PÓS-SALVAMENTO ---
  //   // Precisamos do 'ownerUsername' para o log. 
  //   // Por enquanto, vamos pegá-lo da própria tarefa (já que o dono não muda).
  //   // Em um cenário real, pegaríamos do token JWT (mas teríamos que passá-lo até aqui).
  //   const username = updatedTask.ownerUsername; // Assumindo que o atualizador é o dono

  //   // Log de mudança de Status
  //   if (oldStatus !== updatedTask.status) {
  //     await this.createAuditLog(
  //       updatedTask,
  //       ownerId,
  //       username,
  //       'STATUS_CHANGED',
  //       oldStatus,
  //       updatedTask.status,
  //     );
  //   }

  //   // Log de mudança de Prioridade
  //   if (oldPriority !== updatedTask.priority) {
  //     await this.createAuditLog(
  //       updatedTask,
  //       ownerId,
  //       username,
  //       'PRIORITY_CHANGED',
  //       oldPriority,
  //       updatedTask.priority,
  //     );
  //   }

  //   // Log de mudança de Atribuição (lógica um pouco mais complexa)
  //   const oldAssigneeIds = new Set(oldAssignees.map(u => u.id));
  //   const newAssigneeIds = new Set(updatedTask.assignees.map(u => u.id));

  //   // Verificamos quem foi adicionado
  //   for (const newId of newAssigneeIds) {
  //     if (!oldAssigneeIds.has(newId)) {
  //       const user = updatedTask.assignees.find(u => u.id === newId);
  //       await this.createAuditLog(
  //         updatedTask,
  //         ownerId,
  //         username,
  //         'ASSIGNEE_ADDED',
  //         null,
  //         user?.username || newId, // Salva o nome de usuário se tivermos
  //       );
  //     }
  //   }

  //   // Verificamos quem foi removido
  //   for (const oldId of oldAssigneeIds) {
  //     if (!newAssigneeIds.has(oldId)) {
  //       const user = oldAssignees.find(u => u.id === oldId);
  //       await this.createAuditLog(
  //         updatedTask,
  //         ownerId,
  //         username,
  //         'ASSIGNEE_REMOVED',
  //         user?.username || oldId, // Salva o nome de usuário se tivermos
  //         null,
  //       );
  //     }
  //   }
  //   // --- FIM DO LOG DE AUDITORIA ---

  //   // Emite o evento do RabbitMQ
  //   this.rabbitClient.emit('task_updated', updatedTask);

  //   return updatedTask;
  // }

  async updateTask(
    id: string,
    // 1. Recebe o 'user' (o "ator"), e não mais o 'ownerId'
    user: { userId: string, username: string },
    updateTaskDto: UpdateTaskDto
  ): Promise<Task> {

    // 2. Busca a tarefa, verificando se o "ator" tem permissão para editá-la
    const taskBeforeUpdate = await this.findTaskById(id, user.userId);

    // 3. Salva uma cópia dos valores antigos ANTES de qualquer mudança
    const oldStatus = taskBeforeUpdate.status;
    const oldPriority = taskBeforeUpdate.priority;
    const oldAssignees = [...taskBeforeUpdate.assignees]; // Cópia rasa do array

    // 4. Separa os dados simples (taskData) dos dados de relação (assigneeIds)
    const { assigneeIds, ...taskData } = updateTaskDto;

    // 5. Mescla e SALVA os dados simples (title, status, description, etc.)
    // Esta é a primeira operação de salvamento
    this.taskRepository.merge(taskBeforeUpdate, taskData);
    const savedTask = await this.taskRepository.save(taskBeforeUpdate);

    // 6. Lida com a relação 'assignees' (a lógica que corrigimos antes)
    // Usamos 'hasOwnProperty' para permitir o envio de um array vazio []
    if (Object.prototype.hasOwnProperty.call(updateTaskDto, 'assigneeIds')) {
      let newAssignees: User[] = [];
      if (assigneeIds && assigneeIds.length > 0) {
        newAssignees = await this.preloadAssignees(assigneeIds);
      }

      // Usa o RelationQueryBuilder para atualizar a tabela de junção
      await this.taskRepository
        .createQueryBuilder()
        .relation(Task, 'assignees')
        .of(savedTask) // 'of' a tarefa que acabamos de salvar
        .addAndRemove(newAssignees, oldAssignees); // Sincroniza a lista
    }

    // --- 7. LÓGICA DE AUDITORIA (Corrigida) ---
    // Agora usamos o 'user' (o ator) para criar os logs

    // Log de Status
    if (oldStatus !== savedTask.status) {
      await this.createAuditLog(
        savedTask,
        user.userId,      // ID do ator
        user.username,    // Nome do ator
        'STATUS_CHANGED',
        oldStatus,
        savedTask.status,
      );
    }

    // Log de Prioridade
    if (oldPriority !== savedTask.priority) {
      await this.createAuditLog(
        savedTask,
        user.userId,
        user.username,    // Nome do ator
        'PRIORITY_CHANGED',
        oldPriority,
        savedTask.priority,
      );
    }

    // Log de Atribuição
    if (assigneeIds) { // Só loga se a lista foi explicitamente enviada
      const newAssigneeUsernames = (await this.preloadAssignees(assigneeIds)).map(u => u.username).join(', ') || 'Ninguém';
      const oldAssigneeUsernames = oldAssignees.map(u => u.username).join(', ') || 'Ninguém';

      if (newAssigneeUsernames !== oldAssigneeUsernames) {
        await this.createAuditLog(
          savedTask,
          user.userId,
          user.username,    // Nome do ator
          'ASSIGNEES_CHANGED',
          oldAssigneeUsernames,
          newAssigneeUsernames,
        );
      }
    }

    // --- 8. CORREÇÃO DO BUG DE ATUALIZAÇÃO DO FRONT-END ---
    // Precisamos buscar a tarefa UMA ÚLTIMA VEZ para que ela contenha
    // os novos logs de 'history' que acabamos de salvar.
    const finalTaskWithHistory = await this.findTaskById(id, user.userId);

    // Emite o objeto 100% atualizado (com o 'history') para o RabbitMQ
    this.rabbitClient.emit('task_updated', finalTaskWithHistory);

    // Retorna o objeto 100% atualizado para o api-gateway
    return finalTaskWithHistory;
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