import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    ) { }

    @Post('register')
    registerUser(@Body() body: any) {
        // Envia a mensagem e os dados para o auth-service
        return this.authService.send({ cmd: 'register' }, body);
    }

    @Post('login')
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.send({ cmd: 'login' }, loginUserDto);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt')) // Se o token for inválido ou não existir, ele retorna um erro 401 Unauthorized automaticamente.
    getProfile(@Req() req: any) {
        return req.user;
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.authService.send(
            { cmd: 'update_user' },
            { id, updateUserDto },
        );
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    deleteUser(@Param('id') id: string) {
        return this.authService.send({ cmd: 'delete_user' }, { id });
    }
}
