import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @MessagePattern({ cmd: 'create_task' })
  create(@Payload() payload: { createTaskDto: CreateTaskDto, ownerId: string }) {
    // Repassa os dados para o serviço executar a lógica de negócio
    return this.tasksService.create(payload.createTaskDto, payload.ownerId);
  }

  @MessagePattern({ cmd: 'find_all_tasks_by_owner' })
  findAllByOwner(@Payload() payload: { ownerId: string }) {
    return this.tasksService.findAllTasksByOwner(payload.ownerId);
  }

  @MessagePattern({ cmd: 'find_task_by_id' })
  findTaskById(@Payload() payload: { id: string; ownerId: string }) {
    return this.tasksService.findTaskById(payload.id, payload.ownerId);
  }

  @MessagePattern({ cmd: 'update_task' })
  updateTask(@Payload() payload: { id: string; ownerId: string; updateTaskDto: UpdateTaskDto }) {
    return this.tasksService.updateTask(payload.id, payload.ownerId, payload.updateTaskDto);
  }

  @MessagePattern({ cmd: 'delete_task' })
  deleteTask(@Payload() payload: { id: string; ownerId: string }) {
    return this.tasksService.deleteTask(payload.id, payload.ownerId);
  }

  // Comentários
  @MessagePattern({ cmd: 'add_comment_to_task' })
  addComment(@Payload() payload: { taskId: string; authorId: string; createCommentDto: CreateCommentDto }) {
    return this.tasksService.addComment(payload.taskId, payload.authorId, payload.createCommentDto.content);
  }
}