import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

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
    const ownerUsername = req.user.username;

    return this.tasksService.send(
      { cmd: 'create_task' },
      { createTaskDto, ownerId, ownerUsername },
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findAllTasks(@Req() req: any, @Query() query: TaskQueryDto) {
    // Extrai o ID do usuário do token
    const userId = req.user.userId;

    // 3. Envia o userId e o objeto de query completo para o tasks-service
    return this.tasksService.send(
      { cmd: 'find_all_tasks_for_user' },
      {
        userId,
        search: query.search,
        page: query.page,
        size: query.size,
      },
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findTaskById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'find_task_by_id' },
      { id, userId },
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
  findComments( @Param('id') taskId: string, @Req() req: any, @Query() query: CommentQueryDto) {
    const userId = req.user.userId;

    return this.tasksService.send(
      { cmd: 'find_comments_for_task' },
      {
        taskId,
        userId,
        page: query.page,
        size: query.size
      },
    );
  }
}