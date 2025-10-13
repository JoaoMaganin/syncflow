import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome de usuário único',
    example: 'joaosilva',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'joao.silva@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo de 8 caracteres)',
    example: 'S3nh@F0rt3!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}