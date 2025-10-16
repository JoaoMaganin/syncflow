import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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

  async findTaskById(id: string, ownerId: string): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id, ownerId});

    if(!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    return task;
  }

  async updateTask(id: string, ownerId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTaskById( id, ownerId);

    if(!task) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    const updatedTask = this.taskRepository.merge(task, updateTaskDto);

    return this.taskRepository.save(updatedTask);
  }

  async deleteTask(id: string, ownerId: string): Promise<{ message: string }> {
    // O método delete do repositório pode receber a condição diretamente.
    const result = await this.taskRepository.delete({ id, ownerId });

    // O 'result.affected' nos diz quantas linhas foram deletadas.
    // Se for 0, significa que a tarefa não foi encontrada (ou não pertencia ao usuário).
    if (result.affected === 0) {
      throw new NotFoundException(`Tarefa com ID "${id}" não encontrada.`);
    }

    return { message: `Tarefa com ID "${id}" deletada com sucesso.` };
  }
}