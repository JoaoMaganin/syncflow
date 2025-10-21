import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices'; // 1. IMPORTE
import { ConfigService } from '@nestjs/config'; // 2. IMPORTE
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { User } from './entities/user.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Comment, User]),

    ClientsModule.registerAsync([
      {
        name: 'TASKS_EVENTS_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ, // Define o transporte como RabbitMQ
          options: {
            urls: [configService.get('RABBITMQ_URL')],
            queue: 'tasks_queue', // O nome da "caixa de correio" principal
            queueOptions: {
              durable: true, // Garante que a fila sobreviva a reinicializações
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 10,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule { }