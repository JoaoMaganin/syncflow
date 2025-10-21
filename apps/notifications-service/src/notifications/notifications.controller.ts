import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsGateway } from './notifications.gateway'; // 1. IMPORTE O GATEWAY

@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @EventPattern('task_created')
  handleTaskCreated(@Payload() data: any) {
    console.log('--- NOTIFICATIONS-SERVICE: Evento [task_created] recebido! ---');

    const plainData = JSON.parse(JSON.stringify(data));

    // ENVIE O EVENTO PARA O WEBSOCKET
    // Emite um evento chamado 'new_task' para todos os clientes conectados
    this.notificationsGateway.sendToAll('new_task', plainData);
  }

  @EventPattern('task_updated')
  handleTaskUpdated(@Payload() data: any) {
    console.log('--- NOTIFICATIONS-SERVICE: Evento [task_updated] recebido! ---');

    const plainData = JSON.parse(JSON.stringify(data));

    // ENVIE O EVENTO PARA O WEBSOCKET
    this.notificationsGateway.sendToAll('task_updated_event', plainData);
  }

  @EventPattern('comment_created')
  handleCommentCreated(@Payload() data: any) {
    console.log('--- NOTIFICATIONS-SERVICE: Evento [comment_created] recebido! ---');

    // Converte para um objeto JSON puro
    const plainData = JSON.parse(JSON.stringify(data));

    // Transmite um evento WebSocket chamado 'new_comment'
    this.notificationsGateway.sendToAll('new_comment', plainData);
  }
}