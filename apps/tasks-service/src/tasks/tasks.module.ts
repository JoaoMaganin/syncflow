import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [], // Adicionar o controller depois
  providers: [],   // Adicionar o service depois
})
export class TasksModule {}