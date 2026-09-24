import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType, JobStatus } from '@prisma/client';

// Response DTO explícito em vez de retornar a entity do Prisma direto.
// Motivo: a entity Job não tem campos sensíveis hoje, mas o padrão evita que
// um `select: undefined` futuro em uma query passe companyNotes/relacionamentos
// internos para o cliente sem querer — a serialização é sempre um mapeamento
// deliberado, não um retorno cru do ORM.
export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  requirements?: string | null;

  @ApiPropertyOptional()
  benefits?: string | null;

  @ApiProperty({ enum: ContractType })
  contractType: ContractType;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiPropertyOptional()
  salaryMin?: number | null;

  @ApiPropertyOptional()
  salaryMax?: number | null;

  @ApiProperty()
  isSalaryVisible: boolean;

  @ApiProperty()
  vacancies: number;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  state?: string | null;

  @ApiProperty()
  isRemote: boolean;

  @ApiProperty()
  companyId: string;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
