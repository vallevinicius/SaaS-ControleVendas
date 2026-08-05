import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emailAdmin = 'admin@totalcontrol.local';
  const senhaAdmin = 'Admin@123';

  const existente = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  if (existente) {
    console.log('Seed já aplicado anteriormente — nada a fazer.');
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      nomeFantasia: 'Minha Loja Demo',
      razaoSocial: 'Minha Loja Demo Ltda',
      cnpj: '00.000.000/0001-00',
      planoAtual: 'PRO',
      logoDaLojaUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Minha%20Loja&backgroundType=gradientLinear',
      corPrincipalDoTema: '#2563EB',
      fusoHorario: 'America/Sao_Paulo',
      moeda: 'BRL',
    },
  });

  const senhaHash = await bcrypt.hash(senhaAdmin, 10);
  await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Administrador',
      email: emailAdmin,
      senhaHash,
      papel: 'ADMIN',
    },
  });

  const categoriaGeral = await prisma.categoria.create({
    data: { tenantId: tenant.id, nome: 'Geral' },
  });
  await prisma.categoria.create({
    data: { tenantId: tenant.id, nome: 'Bebidas' },
  });

  await prisma.produto.create({
    data: {
      tenantId: tenant.id,
      nome: 'Produto de exemplo',
      sku: 'EXEMPLO-001',
      categoriaId: categoriaGeral.id,
      precoCusto: 10,
      precoVenda: 19.9,
      quantidadeEmEstoque: 20,
      estoqueMinimo: 5,
    },
  });

  console.log('Seed concluído.');
  console.log(`Login: ${emailAdmin} / Senha: ${senhaAdmin}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
