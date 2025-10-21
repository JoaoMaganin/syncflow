import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// O decorator @WebSocketGateway diz ao NestJS para tratar esta classe
// como um servidor WebSocket. Ele usará a porta 3004 que definimos no main.ts.
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, mude para o seu domínio do front-end
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // Pega uma instância do servidor Socket.IO
  @WebSocketServer()
  server: Server;

  // Este método é chamado quando um novo cliente (nosso React app) se conecta
  handleConnection(client: Socket, ...args: any[]) {
    console.log(`🔌 Cliente conectado: ${client.id}`);
    // TODO: No futuro, associaremos o client.id a um userId (do token JWT)
  }

  // Este método é chamado quando um cliente se desconecta
  handleDisconnect(client: Socket) {
    console.log(`Disconnected: ${client.id}`);
  }

  // --- Funções de Teste e Futuras ---

  // No futuro, o NotificationsService chamará este método
  // para enviar um evento para todos os clientes conectados.
  sendToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}