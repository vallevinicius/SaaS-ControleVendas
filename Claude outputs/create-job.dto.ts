import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractType } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'Desenvolvedor(a) Backend Pleno' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Responsável por manter e evoluir os serviços internos...' })
  @IsString()
  @MinLength(20, { message: 'Descreva a vaga com no mínimo 20 caracteres.' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiProperty({ enum: ContractType, example: ContractType.CLT })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiPropertyOptional({ example: 3000.0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 4500.0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isSalaryVisible?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  vacancies?: number;

  @ApiPropertyOptional({ example: 'Saquarema' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'RJ' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;
}
