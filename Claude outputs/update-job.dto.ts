import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

// PartialType herda os decorators de validação/Swagger do CreateJobDto,
// tornando todos os campos opcionais sem duplicar as regras — evita DTOs
// de update divergirem silenciosamente do DTO de criação ao longo do tempo.
export class UpdateJobDto extends PartialType(CreateJobDto) {}
