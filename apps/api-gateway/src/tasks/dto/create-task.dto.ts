import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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

    @ApiProperty({
        description: 'Uma lista de IDs de usuários para atribuir à tarefa.',
        example: ['uuid-do-usuario-1', 'uuid-do-usuario-2'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    assigneeIds?: string[];
}