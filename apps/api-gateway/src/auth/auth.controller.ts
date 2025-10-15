import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Auth & Users') // Agrupamento para o Swagger
@Controller('auth')
export class AuthController {
    constructor(
        @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Registra um novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    registerUser(@Body() createUserDto: CreateUserDto) {
        // Envia a mensagem e os dados para o auth-service
        return this.authService.send({ cmd: 'register' }, createUserDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Autentica um usuário e retorna um token JWT' })
    @ApiResponse({ status: 201, description: 'Login bem-sucedido, token retornado.' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
    loginUser(@Body() loginUserDto: LoginUserDto) {
        return this.authService.send({ cmd: 'login' }, loginUserDto);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt')) // Se o token for inválido ou não existir, ele retorna um erro 401 Unauthorized automaticamente.
    @ApiBearerAuth() // Indica que esta rota precisa do token
    @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    getProfile(@Req() req: any) {
        return req.user;
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth() // Indica que esta rota precisa do token
    @ApiOperation({ summary: 'Atualiza o perfil do usuário pelo id' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado com sucesso.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.authService.send(
            { cmd: 'update_user' },
            { id, updateUserDto },
        );
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth() // Indica que esta rota precisa do token
    @ApiOperation({ summary: 'Deleta perfil do usuário pelo id' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário deletado com sucesso.' })
    @ApiResponse({ status: 401, description: 'Não autorizado.' })
    deleteUser(@Param('id') id: string) {
        return this.authService.send({ cmd: 'delete_user' }, { id });
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Atualiza o accessToken utilizando o refreshToken' })
    @ApiResponse({ status: 200, description: 'Novo accessToken gerado com sucesso!' })
    @ApiResponse({ status: 401, description: 'Não autorizado ou refreshToken vencido.' })
    async refresh(@Body() body: { refreshToken: string }) {
        try {
            return await firstValueFrom(
                this.authService.send({ cmd: 'refresh' }, { refreshToken: body.refreshToken }),
            );
        } catch (error) {
            console.error('[Gateway] Erro vindo do microserviço Auth:', error);
            throw new UnauthorizedException(error.message || 'Erro ao atualizar token');
        }
    }
}
