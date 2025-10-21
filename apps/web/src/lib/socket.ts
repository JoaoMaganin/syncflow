import { io } from "socket.io-client";

// O endereço do nosso servidor de notificações (que está na porta 3004)
const URL = 'http://localhost:3004';

// Cria a instância do "rádio"
export const socket = io(URL, {
  autoConnect: false, // Desligado por padrão. Ligar quando o usuário fizer login.
});