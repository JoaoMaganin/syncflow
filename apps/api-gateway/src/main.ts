import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000', // URL do seu front-end
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,               // permite envio de cookies/tokens
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true, // Diz ao Pipe para transformar os dados para os tipos do DTO
  }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Jungle Challenge - Task Management API')
    .setDescription('API para o sistema de gestão de tarefas colaborativo.')
    .setVersion('1.0')
    .addBearerAuth() // Adiciona um botão "Authorize" na interface para podermos testar as rotas protegidas.
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Endpoint da documentação
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
}
bootstrap();
