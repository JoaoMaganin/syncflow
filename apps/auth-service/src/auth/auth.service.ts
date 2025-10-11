import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDTO } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

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
}
