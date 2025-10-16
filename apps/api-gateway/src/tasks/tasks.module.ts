import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TasksController } from './tasks.controller';

@Module({
  imports: [
    // Registra a conexão com o tasks-service AQUI
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'tasks-service',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [TasksController],
})
export class TasksModule {}