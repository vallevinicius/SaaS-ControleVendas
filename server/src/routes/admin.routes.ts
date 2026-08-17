import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { assinarTokenAdmin, requirePlatformAdmin } from '../middleware/auth.js';
import { calcularTrialExpiraEm } from '../config/planos.js';

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

adminRouter.get('/empresas', async (_req, res) => {
  const empresas = await prisma.empresa.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      lojas: {
        orderBy: { criadoEm: 'asc' },
        include: {
          usuarios: {
            orderBy: { nome: 'asc' },
            select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
          },
        },
      },
    },
  });

  res.json(
    empresas.map((e) => ({
      id: e.id,
      nome: e.nome,
      planoAtual: e.planoAtual,
      trialExpiraEm: e.trialExpiraEm?.toISOString() ?? undefined,
      ativo: e.ativo,
      criadoEm: e.criadoEm.toISOString(),
      lojas: e.lojas.map((t) => ({
        id: t.id,
        nomeFantasia: t.nomeFantasia,
        razaoSocial: t.razaoSocial ?? undefined,
        cnpj: t.cnpj,
        telefone: t.telefone ?? undefined,
        email: t.email ?? undefined,
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
    })),
  );
});

const novaEmpresaSchema = z.object({
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

adminRouter.post('/empresas', async (req, res) => {
  const parse = novaEmpresaSchema.safeParse(req.body);
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

  const empresa = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nome: nomeFantasia,
        planoAtual,
        trialExpiraEm: planoAtual === 'FREE' ? calcularTrialExpiraEm() : undefined,
      },
    });
    const tenant = await tx.tenant.create({
      data: {
        empresaId: empresa.id,
        nomeFantasia,
        razaoSocial,
        cnpj,
        telefone: telefone || undefined,
        email: email || undefined,
        logoDaLojaUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`,
        corPrincipalDoTema: '#10B981',
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
    return empresa;
  });

  res.status(201).json({ id: empresa.id, nome: empresa.nome });
});

const empresaAtivoSchema = z.object({ ativo: z.boolean() });

adminRouter.put('/empresas/:id/ativo', async (req, res) => {
  const parse = empresaAtivoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Valor inválido.' });
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: req.params.id } });
  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const atualizado = await prisma.empresa.update({
    where: { id: empresa.id },
    data: { ativo: parse.data.ativo },
  });
  res.json({ id: atualizado.id, ativo: atualizado.ativo });
});

adminRouter.delete('/empresas/:id', async (req, res) => {
  const empresa = await prisma.empresa.findUnique({ where: { id: req.params.id }, include: { lojas: true } });
  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const tenantIds = empresa.lojas.map((t) => t.id);

  // Ordem explícita (em vez de confiar em cascade do banco): itens de
  // transação e transações primeiro, depois produtos (que dependem delas),
  // depois categorias (que dependem dos produtos), e o resto por último.
  await prisma.$transaction([
    prisma.itemTransacao.deleteMany({ where: { transacao: { tenantId: { in: tenantIds } } } }),
    prisma.transacao.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.produto.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.categoria.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.lancamentoFinanceiro.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.cliente.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.acessoLoja.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.usuario.deleteMany({ where: { tenantId: { in: tenantIds } } }),
    prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } }),
    prisma.empresa.delete({ where: { id: empresa.id } }),
  ]);

  res.status(204).send();
});

const planoSchema = z.object({
  planoAtual: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
});

adminRouter.put('/empresas/:id/plano', async (req, res) => {
  const parse = planoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Plano inválido.' });
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: req.params.id } });
  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const novoPlano = parse.data.planoAtual;
  const trialExpiraEm = novoPlano === 'FREE' ? calcularTrialExpiraEm() : null;

  const atualizado = await prisma.empresa.update({
    where: { id: empresa.id },
    data: { planoAtual: novoPlano, trialExpiraEm },
  });
  res.json({ id: atualizado.id, planoAtual: atualizado.planoAtual, trialExpiraEm: atualizado.trialExpiraEm });
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
