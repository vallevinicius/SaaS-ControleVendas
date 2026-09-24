import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// PrismaService encapsula o client em um provider injetável, gerenciando o
// ciclo de vida da conexão junto com o Nest (nunca instanciar PrismaClient
// solto em outro lugar da aplicação — isso cria múltiplos pools de conexão).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // 'query' fica desligado por padrão: logar queries em produção pode
      // vazar dados sensíveis (PII, hashes) em sistemas de log centralizados.
      // Habilitar só localmente via env se necessário para debug.
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexão com o banco de dados MySQL estabelecida.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper para transações explícitas nos services que precisam de
  // consistência forte (ex: criar candidatura + decrementar vagas).
  async withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction((tx) => fn(tx as PrismaClient));
  }
}
