import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksService: ClientProxy,
  ) { }

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
      { cmd: 'find_all_tasks_by_user' },
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

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  deleteTask(@Param('id') id: string, @Req() req: any) {
    const ownerId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'delete_task' },
      { id, ownerId },
    );
  }

  // Comentários
  // ENDPOINT PARA CRIAR COMENTÁRIOS
  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addComment(
    @Param('id') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    // 1. Extraia ambos os dados do token
    const authorId = req.user.userId;
    const authorUsername = req.user.username;

    // 2. Adicione o authorUsername ao payload
    return this.tasksService.send(
      { cmd: 'add_comment_to_task' },
      { taskId, authorId, authorUsername, createCommentDto }, // <-- CORRIGIDO!
    );
  }

  @Get(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findComments(@Param('id') taskId: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.tasksService.send(
      { cmd: 'find_comments_for_task' },
      { taskId, userId },
    );
  }
}