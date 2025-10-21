import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TaskQueryDto {
    @ApiPropertyOptional({
        description: 'Termo de busca para o título da tarefa',
        example: 'Relatório',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Número da página que você deseja buscar',
        default: 1,
        type: Number,
    })
    @Type(() => Number) // Converte a string "1" para o número 1
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1; // Define o valor padrão

    @ApiPropertyOptional({
        description: 'Número de itens por página',
        default: 10,
        type: Number,
    })
    @Type(() => Number) // Converte a string "10" para o número 10
    @IsInt()
    @Min(1)
    @IsOptional()
    size?: number = 10; // Define o valor padrão
}