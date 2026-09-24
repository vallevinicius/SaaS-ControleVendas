import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.APPROVED })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  // companyNotes é sempre interno: DTO de resposta ao candidato NUNCA
  // inclui este campo (ver ApplicationResponseDto ausente aqui de propósito
  // — mapeamento explícito no service).
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  companyNotes?: string;
}
