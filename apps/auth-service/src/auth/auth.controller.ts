import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDTO } from './dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @MessagePattern({ cmd: 'register' })
    registerUser(@Payload() createUserDto: CreateUserDTO){
        return this.authService.createUser(createUserDto);
    };
}
