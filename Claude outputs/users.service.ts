import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // findById nunca retorna passwordHash/refreshTokenHash: select explícito,
  // nunca `include`/objeto cru do Prisma direto para fora do service.
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        candidateProfile: true,
        company: { select: { id: true, legalName: true, isVerified: true } },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }
}
