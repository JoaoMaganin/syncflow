import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe());

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
