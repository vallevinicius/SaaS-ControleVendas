import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ContractType, JobStatus } from '@prisma/client';

export class QueryJobsDto {
  @ApiPropertyOptional({ description: 'Busca textual em título/descrição.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Saquarema' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ContractType })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiPropertyOptional({ enum: JobStatus, description: 'Somente ADMIN/COMPANY podem filtrar por status != OPEN.' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRemote?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Limite máximo hard-coded (Max(100)): sem isso, um client mal-intencionado
  // pede pageSize=1000000 e força uma query pesada / possível vetor de DoS
  // na camada de banco.
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
