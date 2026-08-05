import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

/**
 * Garante que a conta de admin da plataforma (Total Software) existe e usa
 * a senha atual definida em ADMIN_EMAIL/ADMIN_SENHA no .env. Rodando isso a
 * cada start do servidor, trocar essas variáveis e reiniciar já atualiza o
 * login do painel /admin — sem precisar de seed manual.
 */
export async function garantirAdminPlataforma(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;

  if (!email || !senha) {
    console.warn('ADMIN_EMAIL/ADMIN_SENHA não definidos em server/.env — painel /admin ficará inacessível.');
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.adminPlataforma.upsert({
    where: { email },
    update: { senhaHash },
    create: { nome: 'Admin Total Software', email, senhaHash },
  });

  console.log(`Admin da plataforma pronto: ${email}`);
}
