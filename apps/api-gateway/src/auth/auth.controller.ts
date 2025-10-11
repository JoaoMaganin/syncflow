import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    ) {}

    @Post('register')
    registerUser(@Body() body: any) {
        // Envia a mensagem e os dados para o auth-service
        return this.authService.send({ cmd: 'register' }, body);
    }
}
