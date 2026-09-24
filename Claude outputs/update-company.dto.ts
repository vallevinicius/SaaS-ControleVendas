import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

// CNPJ nunca é editável via este DTO: alterar o CNPJ de uma empresa já
// verificada seria uma forma de contornar a verificação manual da Prefeitura
// (empresa aprovada troca o CNPJ para um não verificado e mantém isVerified=true).
// Alteração de CNPJ, se necessária, exige um fluxo administrativo próprio.
export class UpdateCompanyDto extends PartialType(OmitType(CreateCompanyDto, ['cnpj'] as const)) {}
