import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
    @ApiProperty({ description: 'O título da tarefa', example: 'Corrigir bug na tela de login' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiProperty({ required: false, description: 'Uma descrição detalhada da tarefa', example: 'O botão de login não funciona no Safari.' })
    @IsString()
    @IsOptional()
    description?: string;
}