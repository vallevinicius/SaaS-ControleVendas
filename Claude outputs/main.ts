import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Nunca deixar bufferLogs=false em produção sem um logger estruturado configurado.
    bufferLogs: true,
  });

  // Security headers. Sem isso, a API sai sem proteção básica contra
  // clickjacking, sniffing de MIME type, etc. Não é "nice to have".
  app.use(helmet());

  // CORS explícito por whitelist. Nunca usar `origin: true`/`*` com credentials
  // em produção: isso é uma configuração clássica de CORS misconfiguration
  // que permite qualquer origem ler respostas autenticadas.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  // Validação global: rejeita payloads com propriedades não esperadas (whitelist)
  // e converte tipos primitivos automaticamente. forbidNonWhitelisted é o que
  // de fato bloqueia mass-assignment de campos que o DTO não declarou —
  // sem isso, `whitelist: true` sozinho apenas remove os campos, silenciosamente.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro global de exceções: garante que stack traces e detalhes internos
  // (queries do Prisma, paths de arquivo, etc.) NUNCA vazem na resposta HTTP.
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Portal de Empregos - Prefeitura de Saquarema')
    .setDescription(
      'API REST para conexão entre empresas locais e cidadãos candidatos a vagas de emprego.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('auth', 'Autenticação e emissão de tokens')
    .addTag('users', 'Gestão de usuários')
    .addTag('companies', 'Empresas cadastradas')
    .addTag('jobs', 'Vagas de emprego')
    .addTag('applications', 'Candidaturas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
