import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JobStatus } from '@prisma/client';

// Endpoint dedicado de transição de status, separado do update genérico.
// Justificativa: mudança de status tem regras de transição próprias
// (ex: CLOSED não deveria voltar a OPEN diretamente) que ficam mais claras
// isoladas do PATCH genérico de campos de conteúdo.
export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatus, example: JobStatus.OPEN })
  @IsEnum(JobStatus)
  status: JobStatus;
}
