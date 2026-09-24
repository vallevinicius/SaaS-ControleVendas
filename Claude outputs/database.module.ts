import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global evita ter que importar DatabaseModule em cada módulo de feature.
// Trade-off consciente: acoplamento implícito ao Prisma em toda a aplicação
// (não é Clean Architecture "pura", que isolaria via interface/repository
// por módulo). Para o tamanho deste projeto, o ganho de simplicidade YAGNI
// compensa; se a equipe crescer ou for necessário trocar de ORM, revisitar
// isso com repositórios por módulo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
