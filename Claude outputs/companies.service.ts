import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(user: AuthenticatedUser, dto: CreateCompanyDto) {
    const existingCnpj = await this.prisma.company.findUnique({ where: { cnpj: dto.cnpj } });
    if (existingCnpj) {
      throw new ConflictException('CNPJ já cadastrado na plataforma.');
    }

    const existingForUser = await this.prisma.company.findUnique({ where: { userId: user.id } });
    if (existingForUser) {
      throw new ConflictException('Este usuário já possui um perfil de empresa.');
    }

    // isVerified sempre false na criação — nunca aceitar esse campo vindo
    // do DTO. A verificação é um passo manual/administrativo (fora do
    // escopo deste módulo) antes que a empresa possa publicar vagas.
    return this.prisma.company.create({
      data: { ...dto, userId: user.id, isVerified: false },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return company;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCompanyDto) {
    const company = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && company.userId !== user.id) {
      throw new ForbiddenException('Você não tem permissão para editar esta empresa.');
    }

    return this.prisma.company.update({ where: { id }, data: dto });
  }

  // Ação restrita a ADMIN — reforçado também no controller via @Roles.
  // Dupla checagem deliberada (defense in depth): mesmo que o guard de rota
  // seja removido por engano no futuro, o service ainda barra a operação.
  async verify(adminUser: AuthenticatedUser, id: string) {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem verificar empresas.');
    }
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: { isVerified: true } });
  }
}
