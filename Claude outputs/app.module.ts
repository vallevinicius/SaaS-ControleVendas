import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validateEnv } from './config/env.validation';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      // Falha rápido: se faltar variável obrigatória (ex: JWT_SECRET, DATABASE_URL),
      // a aplicação não deve subir "quase funcionando" e falhar em produção depois.
      validate: validateEnv,
    }),

    // Rate limiting global. Sem isso, endpoints de auth (login, registro,
    // recuperação de senha) ficam abertos para brute-force/credential stuffing.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    DatabaseModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    JobsModule,
    ApplicationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
