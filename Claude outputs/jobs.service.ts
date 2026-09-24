import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateJobDto) {
    const company = await this.getCompanyOrThrow(user.id);

    // Empresa não verificada pela Prefeitura não pode publicar vagas.
    // Regra de negócio de confiança: sem isso, qualquer CNPJ cadastrado
    // (mesmo fraudulento) publicaria vagas imediatamente no portal público.
    if (!company.isVerified) {
      throw new ForbiddenException(
        'Sua empresa ainda não foi verificada pela Prefeitura. Aguarde a aprovação para publicar vagas.',
      );
    }

    if (dto.salaryMin != null && dto.salaryMax != null && dto.salaryMin > dto.salaryMax) {
      throw new BadRequestException('salaryMin não pode ser maior que salaryMax.');
    }

    return this.prisma.job.create({
      data: {
        ...dto,
        companyId: company.id,
        status: JobStatus.DRAFT,
      },
    });
  }

  async findAll(user: AuthenticatedUser | undefined, query: QueryJobsDto) {
    const { search, city, contractType, status, isRemote, page = 1, pageSize = 20 } = query;

    // Candidato anônimo/candidato autenticado só enxerga vagas OPEN.
    // Filtrar por status arbitrário é restrito a COMPANY (só a própria vaga,
    // reforçado no where abaixo) e ADMIN — impede que qualquer usuário
    // liste rascunhos (DRAFT) de vagas de terceiros varrendo o endpoint público.
    const canFilterByStatus = user?.role === UserRole.ADMIN || user?.role === UserRole.COMPANY;

    const where: Prisma.JobWhereInput = {
      status: canFilterByStatus && status ? status : JobStatus.OPEN,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(city && { city: { equals: city } }),
      ...(contractType && { contractType }),
      ...(isRemote !== undefined && { isRemote }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Vaga não encontrada.');
    }
    return job;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateJobDto) {
    const job = await this.findOne(id);
    await this.assertOwnership(user, job.companyId);

    if (
      (dto.salaryMin ?? job.salaryMin?.toNumber()) != null &&
      (dto.salaryMax ?? job.salaryMax?.toNumber()) != null &&
      (dto.salaryMin ?? job.salaryMin!.toNumber()) > (dto.salaryMax ?? job.salaryMax!.toNumber())
    ) {
      throw new BadRequestException('salaryMin não pode ser maior que salaryMax.');
    }

    return this.prisma.job.update({ where: { id }, data: dto });
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: JobStatus) {
    const job = await this.findOne(id);
    await this.assertOwnership(user, job.companyId);

    const data: Prisma.JobUpdateInput = { status };
    if (status === JobStatus.OPEN && !job.publishedAt) {
      data.publishedAt = new Date();
    }

    return this.prisma.job.update({ where: { id }, data });
  }

  async remove(user: AuthenticatedUser, id: string) {
    const job = await this.findOne(id);
    await this.assertOwnership(user, job.companyId);

    // Soft delete via status CLOSED em vez de hard delete: preserva o
    // histórico de candidaturas (Application referencia Job via FK) e
    // permite auditoria posterior pela Prefeitura. Hard delete aqui
    // cascatearia e apagaria o histórico de candidaturas do cidadão.
    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.CLOSED },
    });
  }

  // Checagem central de posse do recurso. Toda mutação em Job passa por aqui
  // — é exatamente o ponto que, se esquecido em um único endpoint, vira um
  // IDOR (empresa A editando/fechando a vaga da empresa B só trocando o :id
  // na URL). ADMIN tem bypass explícito e documentado, nunca implícito.
  private async assertOwnership(user: AuthenticatedUser, companyId: string) {
    if (user.role === UserRole.ADMIN) return;

    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company || company.id !== companyId) {
      throw new ForbiddenException('Você não tem permissão para gerenciar esta vaga.');
    }
  }

  private async getCompanyOrThrow(userId: string) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) {
      throw new BadRequestException('É necessário ter um perfil de empresa para publicar vagas.');
    }
    return company;
  }
}
