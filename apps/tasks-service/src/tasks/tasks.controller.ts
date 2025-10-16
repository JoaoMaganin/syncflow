import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern({ cmd: 'create_task' })
  create(@Payload() payload: { createTaskDto: CreateTaskDto, ownerId: string }) {
    // Repassa os dados para o serviço executar a lógica de negócio
    return this.tasksService.create(payload.createTaskDto, payload.ownerId);
  }
}