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
      planoAtual: t.planoAtual,
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
