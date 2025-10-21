import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Crie a aplicação web principal (para o WebSocket)
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const rmqUrl = configService.get<string>('RABBITMQ_URL') as string ||
      'amqp://admin:admin@rabbitmq:5672';

  console.log('🐇 RABBITMQ_URL =', rmqUrl);

  // Conecte o "ouvinte" do RabbitMQ à aplicação principal
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'tasks_queue', // O NOME EXATO DA FILA QUE O TASKS-SERVICE ESTÁ USANDO
      queueOptions: {
        durable: true,
      },
    },
  });

  // Inicie TODOS os serviços (o listener do RabbitMQ e o servidor web)
  await app.startAllMicroservices();

  // A porta 3004 é para o nosso servidor WebSocket
  await app.listen(3004); 
  console.log('Notifications service (Websocket & RMQ) is running on port 3004');
}
bootstrap();