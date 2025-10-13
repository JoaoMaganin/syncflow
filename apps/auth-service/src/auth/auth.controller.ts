import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDTO } from './dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @MessagePattern({ cmd: 'register' })
    registerUser(@Payload() createUserDto: CreateUserDTO) {
        return this.authService.createUser(createUserDto);
    };

    @MessagePattern({ cmd: 'login' })
    loginUser(@Payload() loginUserDto: LoginUserDto) {
        return this.authService.login(loginUserDto);
    }

    @MessagePattern({ cmd: 'update_user' })
    updateUser(@Payload() payload: { id: string; updateUserDto: UpdateUserDto }) {
        return this.authService.updateUser(payload.id, payload.updateUserDto);
    }

    @MessagePattern({ cmd: 'delete_user' })
    deleteUser(@Payload() payload: { id: string }) {
        return this.authService.deleteUser(payload.id);
    }
}
