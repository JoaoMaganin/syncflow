import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async createUser(createUserDto: CreateUserDTO) {
    // criptografando a senha
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // nova entidade de usuário
    const newUser = this.userRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      passwordHash
    })

    await this.userRepository.save(newUser);

    // retorna o user novo sem a senha
    const { passwordHash: _, ...user } = newUser;
    return user;
  }


  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOneBy({
      email: loginUserDto.email,
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordMatch = await bcrypt.compare(
      loginUserDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 1. Definir o payload do token
    const payload = { sub: user.id, username: user.username };

    // 2. Gerar o accessToken
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '30s' });

    // 3. Gerar o refreshToken
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '2m', })

    user.refreshToken = refreshToken;
    await this.userRepository.save(user);

    // 4. Retornar o token
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username
      }
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token ausente');

    try {
      // Verifica e decodifica
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.userRepository.findOneBy({ id: payload.sub });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      // Remove exp/iat para não gerar erro ao assinar
      const { exp, iat, ...tokenPayload } = payload;

      const newAccessToken = await this.jwtService.signAsync(tokenPayload, { expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '30s' });

      // Retorna o mesmo refreshToken
      return { accessToken: newAccessToken, refreshToken };
    } catch (err) {
      console.error('[DEBUG] Erro ao validar refreshToken:', err);
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }

    // Se uma nova senha foi enviada, criptografe-a
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    // O TypeORM `preload` mescla o DTO com a entidade encontrada
    // e renomeia `password` para `passwordHash` para nós
    const updatedUser = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
      passwordHash: updateUserDto.password, // Mapeia a nova senha se existir
    });

    if (!updatedUser) {
      throw new NotFoundException(`Não foi possível atualizar o usuário com ID "${id}".`);
    }

    return this.userRepository.save(updatedUser);
  }

  async deleteUser(id: string) {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }

    // Retorna uma mensagem de sucesso
    return { message: `Usuário com ID "${id}" deletado com sucesso.` };
  }
}
