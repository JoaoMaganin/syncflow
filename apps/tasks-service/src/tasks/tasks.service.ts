import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>
  ) { }

  /*
   * Cria uma nova tarefa.
   * @param createTaskDto - Os dados da tarefa a ser criada.
   * @param ownerId - O ID do usuário que está criando a tarefa (virá do token JWT).
   */
  async create(createTaskDto: CreateTaskDto, ownerId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      ownerId, // Associa a tarefa ao usuário dono
    });

    return this.taskRepository.save(task);
  }

  async findAllTasksByOwner(ownerId: string): Promise<Task[]> {
    // Usa o repositório para encontrar todas as tarefas onde o ownerId corresponde.
    return this.taskRepository.find({
      where: { ownerId },
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
    const task = await this.findTaskById(id, ownerId);

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    const updatedTask = this.taskRepository.merge(task, updateTaskDto);

    return this.taskRepository.save(updatedTask);
  }

  async deleteTask(id: string, ownerId: string): Promise<Task> {
    const task = await this.findTaskById(id, ownerId);

    await this.taskRepository.remove(task);

    return task;
  }

  // Comentários
  async addComment(taskId: string, authorId: string, content: string): Promise<Comment> {
    // Primeiro, verifica se a tarefa existe.
    const task = await this.taskRepository.findOneBy({ id: taskId });

    if (!task) {
      throw new NotFoundException(`Tarefa com ID "${taskId}" não encontrada.`);
    }

    const newComment = this.commentRepository.create({
      content,
      authorId,
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