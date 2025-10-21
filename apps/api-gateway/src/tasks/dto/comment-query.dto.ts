import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CommentQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página de comentários',
    default: 1,
    type: Number,
  })
  @Type(() => Number) // Converte a string da URL para número
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1; // Valor padrão

  @ApiPropertyOptional({
    description: 'Número de comentários por página',
    default: 5, // Vamos usar 5 como padrão para comentários
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number = 5; // Valor padrão
}