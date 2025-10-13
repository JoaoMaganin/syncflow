import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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
    const accessToken = await this.jwtService.signAsync(payload);

    // 3. Retornar o token
    return {
      accessToken,
    };
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
