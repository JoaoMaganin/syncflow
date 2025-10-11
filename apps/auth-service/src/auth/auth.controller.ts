import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthController {
    @MessagePattern({ cmd: 'register' })
    registerUser(@Payload() data: any){
        console.log('Mensagem recebida no auth-service: ', data);

        // futuramente: lógica do bb

        // Resposta enviada de volta ao api-gateway
        return {
            message: 'Usuário registrado com sucesso!',
            receivedData: data,
        }
    };
}
