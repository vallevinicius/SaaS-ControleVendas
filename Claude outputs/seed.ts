import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@saquarema.rj.gov.br';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('Admin já existe, seed ignorado.');
    return;
  }

  // Senha forte apenas para ambiente de desenvolvimento. NUNCA usar uma senha
  // fixa/previsível de seed em produção — trocar imediatamente após o deploy inicial.
  const passwordHash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!12345');

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Usuário admin criado: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
