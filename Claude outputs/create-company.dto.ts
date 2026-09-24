import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, Matches, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Comércio de Alimentos Saquarema LTDA' })
  @IsString()
  @MinLength(3)
  legalName: string;

  @ApiPropertyOptional({ example: 'Padaria do João' })
  @IsOptional()
  @IsString()
  tradeName?: string;

  // Validação de formato apenas (14 dígitos). O checksum/dígito verificador
  // do CNPJ e a consulta de existência real (Receita Federal) devem ocorrer
  // em um serviço dedicado no backend, nunca confiando no client — e essa
  // chamada a serviço externo deve ter timeout curto e nunca repassar a URL
  // construída a partir de input do usuário sem allowlist (superfície de SSRF).
  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos.' })
  cnpj: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Saquarema' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'RJ' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
