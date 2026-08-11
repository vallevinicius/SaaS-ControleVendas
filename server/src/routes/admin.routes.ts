import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { assinarTokenAdmin, requirePlatformAdmin } from '../middleware/auth.js';

export const adminRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

adminRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }
  const { email, senha } = parse.data;

  const admin = await prisma.adminPlataforma.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const senhaConfere = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = assinarTokenAdmin({ id: admin.id });
  res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email } });
});

adminRouter.use(requirePlatformAdmin);

adminRouter.get('/tenants', async (_req, res) => {
  const tenants = await prisma.tenant.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      usuarios: {
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
      },
    },
  });

  res.json(
    tenants.map((t) => ({
      id: t.id,
      nomeFantasia: t.nomeFantasia,
      razaoSocial: t.razaoSocial ?? undefined,
      cnpj: t.cnpj,
      telefone: t.telefone ?? undefined,
      email: t.email ?? undefined,
      planoAtual: t.planoAtual,
      ativo: t.ativo,
      criadoEm: t.criadoEm.toISOString(),
      usuarios: t.usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        papel: u.papel,
        ativo: u.ativo,
        criadoEm: u.criadoEm.toISOString(),
      })),
    })),
  );
});

const novaLojaSchema = z.object({
  nomeFantasia: z.string().min(2),
  razaoSocial: z.string().optional(),
  cnpj: z.string().min(1),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  planoAtual: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).default('FREE'),
  nomeAdmin: z.string().min(2),
  emailAdmin: z.string().email(),
  senhaAdmin: z.string().min(6),
});

adminRouter.post('/tenants', async (req, res) => {
  const parse = novaLojaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }
  const { nomeFantasia, razaoSocial, cnpj, telefone, email, planoAtual, nomeAdmin, emailAdmin, senhaAdmin } = parse.data;

  const emailExistente = await prisma.usuario.findUnique({ where: { email: emailAdmin } });
  if (emailExistente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }
  const cnpjExistente = await prisma.tenant.findUnique({ where: { cnpj } });
  if (cnpjExistente) {
    return res.status(409).json({ erro: 'Já existe uma loja cadastrada com este CNPJ.' });
  }

  const senhaHash = await bcrypt.hash(senhaAdmin, 10);

  const tenant = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        nomeFantasia,
        razaoSocial,
        cnpj,
        telefone: telefone || undefined,
        email: email || undefined,
        planoAtual,
        logoDaLojaUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`,
        corPrincipalDoTema: '#2563EB',
      },
    });
    await tx.usuario.create({
      data: {
        tenantId: tenant.id,
        nome: nomeAdmin,
        email: emailAdmin,
        senhaHash,
        papel: 'ADMIN',
        raiz: true,
      },
    });
    await tx.categoria.create({ data: { tenantId: tenant.id, nome: 'Geral' } });
    return tenant;
  });

  res.status(201).json({ id: tenant.id, nomeFantasia: tenant.nomeFantasia });
});

const tenantAtivoSchema = z.object({ ativo: z.boolean() });

adminRouter.put('/tenants/:id/ativo', async (req, res) => {
  const parse = tenantAtivoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Valor inválido.' });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });

  const atualizado = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { ativo: parse.data.ativo },
  });
  res.json({ id: atualizado.id, ativo: atualizado.ativo });
});

adminRouter.delete('/tenants/:id', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });

  // Ordem explícita (em vez de confiar em cascade do banco): itens de
  // transação e transações primeiro, depois produtos (que dependem delas),
  // depois categorias (que dependem dos produtos), e o resto por último.
  await prisma.$transaction([
    prisma.itemTransacao.deleteMany({ where: { transacao: { tenantId: tenant.id } } }),
    prisma.transacao.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.produto.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.categoria.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.lancamentoFinanceiro.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.cliente.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.usuario.deleteMany({ where: { tenantId: tenant.id } }),
    prisma.tenant.delete({ where: { id: tenant.id } }),
  ]);

  res.status(204).send();
});

const planoSchema = z.object({
  planoAtual: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
});

adminRouter.put('/tenants/:id/plano', async (req, res) => {
  const parse = planoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Plano inválido.' });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });

  const atualizado = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { planoAtual: parse.data.planoAtual },
  });
  res.json({ id: atualizado.id, planoAtual: atualizado.planoAtual });
});

const ativoSchema = z.object({ ativo: z.boolean() });

adminRouter.put('/usuarios/:id/ativo', async (req, res) => {
  const parse = ativoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Valor inválido.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ativo: parse.data.ativo },
  });
  res.json({ id: atualizado.id, ativo: atualizado.ativo });
});

function gerarSenhaTemporaria(): string {
  return crypto.randomBytes(9).toString('base64url');
}

adminRouter.post('/usuarios/:id/resetar-senha', async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const senhaTemporaria = gerarSenhaTemporaria();
  const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash } });

  res.json({ senhaTemporaria });
});
