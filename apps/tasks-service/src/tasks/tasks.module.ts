import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Comment } from './entities/comment.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Comment, User])],
  controllers: [TasksController], // Adicionar o controller depois
  providers: [TasksService],   // Adicionar o service depois
})
export class TasksModule {}