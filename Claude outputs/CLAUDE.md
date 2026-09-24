# CLAUDE.md — Portal de Empregos da Prefeitura de Saquarema (Backend)

Este arquivo documenta fatos específicos deste projeto. Diretrizes globais de
postura/qualidade estão no perfil global do usuário, não aqui.

## Stack
- NestJS 10 + TypeScript
- Prisma ORM 5 sobre MySQL 8
- Auth: JWT (access 15m / refresh 7d), estratégia Passport, senha com argon2id
- Docs: Swagger em `/docs`, prefixo de API `/api/v1`

## Decisões de arquitetura já tomadas (não revisitar sem motivo novo)
- `DatabaseModule` é `@Global()` — Prisma injetado direto nos services, sem
  camada de Repository por módulo. Trade-off: menos abstração/boilerplate
  (YAGNI) em troca de acoplamento ao Prisma. Revisitar apenas se houver
  necessidade real de trocar de ORM ou multi-tenant complexo.
- Ownership de recursos (Job, Company, Application) é checado no SERVICE,
  nunca só no controller/guard — é o ponto central de defesa contra IDOR.
  Qualquer novo endpoint de mutação sobre esses recursos DEVE reusar/estender
  `assertOwnership` / `assertCompanyOwnsJob`.
- Soft delete em `Job` (status `CLOSED`), nunca hard delete — preserva
  histórico de `Application`.
- Role `ADMIN` nunca é atribuível via endpoint público de registro.

## Convenções de branch (obrigatório)
- Nunca commitar direto em `main`/`master`/`develop`.
- Padrão: `feat/<contexto>`, `fix/<contexto>`, `refactor/<contexto>`.
  Exemplos usados neste projeto: `feat/jobs-module`, `fix/jwt-auth-filter`,
  `refactor/prisma-service`.

## Endpoints principais (v1, prefixo `/api/v1`)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /users/me`
- `POST /companies`, `GET /companies/:id`, `PATCH /companies/:id`, `PATCH /companies/:id/verify` (ADMIN)
- `POST /jobs`, `GET /jobs`, `GET /jobs/:id`, `PATCH /jobs/:id`, `PATCH /jobs/:id/status`, `DELETE /jobs/:id`
- `POST /applications`, `GET /applications/me`, `GET /applications/job/:jobId`, `PATCH /applications/:id/status`, `PATCH /applications/:id/withdraw`

## Pendências conhecidas (não implementadas neste scaffold inicial)
- Verificação real de CNPJ (Receita Federal ou similar): quando implementada,
  isolar em um `HttpModule` com timeout curto e allowlist de host — risco de
  SSRF se a URL for montada com input do usuário sem validação.
- Job agendado (cron) para expirar vagas com `expiresAt` vencido.
- Upload de currículo (`resumeUrl`): definir bucket S3/GCS + validação de
  tipo MIME e tamanho antes de aceitar em produção; nunca aceitar upload
  direto para o banco.
- Testes automatizados (unit/e2e) ainda não escritos.
