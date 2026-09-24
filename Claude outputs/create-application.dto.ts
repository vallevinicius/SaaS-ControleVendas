import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'ID da vaga à qual o candidato está se candidatando.' })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}
