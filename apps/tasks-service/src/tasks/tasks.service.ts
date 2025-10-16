import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

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
}