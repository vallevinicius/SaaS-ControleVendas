import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Uso: @Roles(UserRole.COMPANY, UserRole.ADMIN)
// Combinado sempre com RolesGuard — decorator sozinho não protege nada.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
