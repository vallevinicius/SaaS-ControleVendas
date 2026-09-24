import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, JobStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(user: AuthenticatedUser, dto: CreateApplicationDto) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidate) {
      throw new ForbiddenException('Complete seu perfil de candidato antes de se candidatar.');
    }

    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job || job.status !== JobStatus.OPEN) {
      // Mesma resposta para "não existe" e "não está aberta": não revela ao
      // client se o id é de uma vaga em DRAFT/CLOSED de outra empresa.
      throw new NotFoundException('Vaga não encontrada ou não está aceitando candidaturas.');
    }

    try {
      return await this.prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          coverLetter: dto.coverLetter,
          status: ApplicationStatus.PENDING,
        },
      });
    } catch (error) {
      // Confia na constraint única do banco (@@unique candidateId+jobId) como
      // última linha de defesa contra race condition (dois cliques rápidos
      // no "candidatar-se"), em vez de um SELECT prévio que teria TOCTOU.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Você já se candidatou a esta vaga.');
      }
      throw error;
    }
  }

  async findMineAsCandidate(user: AuthenticatedUser) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    if (!candidate) return [];

    return this.prisma.application.findMany({
      where: { candidateId: candidate.id },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForJob(user: AuthenticatedUser, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Vaga não encontrada.');

    await this.assertCompanyOwnsJob(user, job.companyId);

    return this.prisma.application.findMany({
      where: { jobId },
      // include seletivo: nunca vazar dados do User (passwordHash) — sempre
      // atravessar a relação CandidateProfile, nunca `include: { candidate: { include: { user: true } } }`
      // sem um select explícito.
      include: {
        candidate: {
          select: { id: true, fullName: true, city: true, state: true, resumeUrl: true, headline: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    user: AuthenticatedUser,
    applicationId: string,
    status: ApplicationStatus,
    companyNotes?: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) throw new NotFoundException('Candidatura não encontrada.');

    await this.assertCompanyOwnsJob(user, application.job.companyId);

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status, companyNotes, reviewedAt: new Date() },
    });
  }

  async withdraw(user: AuthenticatedUser, applicationId: string) {
    const candidate = await this.prisma.candidateProfile.findUnique({ where: { userId: user.id } });
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });

    if (!application || !candidate || application.candidateId !== candidate.id) {
      // Novamente resposta uniforme (404) em vez de 403 detalhado: não
      // confirma para o client que o id de candidatura existe e pertence
      // a outra pessoa.
      throw new NotFoundException('Candidatura não encontrada.');
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });
  }

  private async assertCompanyOwnsJob(user: AuthenticatedUser, companyId: string) {
    if (user.role === UserRole.ADMIN) return;

    const company = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (!company || company.id !== companyId) {
      throw new ForbiddenException('Você não tem permissão para acessar estas candidaturas.');
    }
  }
}
