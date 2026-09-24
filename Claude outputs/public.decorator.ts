import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca uma rota como pública em um sistema com JwtAuthGuard global.
// Uso deliberado e explícito: exceção visível no código, não configuração
// implícita espalhada.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
