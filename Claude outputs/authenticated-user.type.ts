import { UserRole } from '@prisma/client';

// Payload mínimo anexado a req.user após validação do JWT.
// Deliberadamente NÃO inclui dados sensíveis (passwordHash, refreshTokenHash).
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

// Claims efetivamente assinadas dentro do JWT.
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
}
