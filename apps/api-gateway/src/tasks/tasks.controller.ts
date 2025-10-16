import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksService: ClientProxy,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  createTask(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    const ownerId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'create_task' },
      { createTaskDto, ownerId },
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt')) // A rota é protegida!
  @ApiBearerAuth()
  findAllTasks(@Req() req: any) {
    // Extrai o ID do usuário do token (injetado pelo JwtAuthGuard)
    const ownerId = req.user.userId;

    // Envia o comando para o tasks-service
    return this.tasksService.send(
      { cmd: 'find_all_tasks_by_owner' },
      { ownerId },
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findTaskById(@Param('id') id: string, @Req() req: any) {
    const ownerId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'find_task_by_id' },
      { id, ownerId },
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const ownerId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'update_task' },
      { id, ownerId, updateTaskDto },
    );
  }

}