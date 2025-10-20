import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { User } from './entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    return this.taskRepository.save(task);
  }

  async findAllTasksByUserId(ownerId: string): Promise<Task[]> {
    // O TypeORM permite passar um array para o 'where',
    // que funciona como uma cláusula 'OR'.
    return this.taskRepository.find({
      where: [
        // Encontra tarefas onde o usuário é o criador
        { ownerId: ownerId },

        // OU encontra tarefas onde o ID do usuário está na lista de 'assignees'
        { assignees: { id: ownerId } }
      ],
      // Também carregamos as relações para que o front-end saiba quem são os criadores e atribuídos
      relations: {
        assignees: true,
        comments: true,
      },
      order: { createdAt: 'DESC' }, // Ordena da mais recente para a mais antiga
    });
  }

  async findTaskById(id: string, ownerId: string): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id, ownerId });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    return task;
  }

  async updateTask(id: string, ownerId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const { assigneeIds, ...taskData } = updateTaskDto;

    // Busca a tarefa para garantir que ela existe e pertence ao usuário.
    const task = await this.findTaskById(id, ownerId);

    // Se o DTO de atualização incluiu uma nova lista de 'assigneeIds',
    // vamos processá-la.
    if (assigneeIds) {
      if (assigneeIds.length > 0) {
        task.assignees = await this.preloadAssignees(assigneeIds);
      } else {
        // Se foi enviado um array vazio, removemos todas as atribuições.
        task.assignees = [];
      }
    }

    // Mescla os outros dados (title, description, etc.)
    const updatedTask = this.taskRepository.merge(task, taskData);

    // Salva a entidade completa. O TypeORM vai ATUALIZAR a tabela de junção.
    return this.taskRepository.save(updatedTask);
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

    return this.commentRepository.save(newComment);
  }

  async findCommentsByTask(taskId: string, userId: string): Promise<Comment[]> {
    // Busca a tarefa e, se ela pertencer ao usuário, já carrega os comentários junto.
    const task = await this.taskRepository.findOne({
      where: { id: taskId, ownerId: userId },
      relations: ['comments'], // Diz ao TypeORM para "juntar" os comentários
      order: { comments: { createdAt: 'DESC' } } // Ordena os comentários do mais novo para o mais antigo
    });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${taskId}" não encontrada ou você não tem permissão para vê-la.`);
    }

    return task.comments;
  }


}