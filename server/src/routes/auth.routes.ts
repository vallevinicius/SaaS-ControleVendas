import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { assinarToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  nomeFantasia: z.string().min(2),
  cnpj: z.string().min(1),
  telefone: z.string().optional(),
  emailContato: z.string().email().optional().or(z.literal('')),
  nomeAdmin: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
});

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }
  const { nomeFantasia, cnpj, telefone, emailContato, nomeAdmin, email, senha } = parse.data;

  const emailExistente = await prisma.usuario.findUnique({ where: { email } });
  if (emailExistente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }
  const cnpjExistente = await prisma.tenant.findUnique({ where: { cnpj } });
  if (cnpjExistente) {
    return res.status(409).json({ erro: 'Já existe uma loja cadastrada com este CNPJ.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { tenant, usuario } = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        nomeFantasia,
        cnpj,
        telefone: telefone || undefined,
        email: emailContato || undefined,
        planoAtual: 'FREE',
        logoDaLojaUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`,
        corPrincipalDoTema: '#2563EB',
      },
    });
    const usuario = await tx.usuario.create({
      data: {
        tenantId: tenant.id,
        nome: nomeAdmin,
        email,
        senhaHash,
        papel: 'ADMIN',
        raiz: true,
      },
    });
    await tx.categoria.create({ data: { tenantId: tenant.id, nome: 'Geral' } });
    return { tenant, usuario };
  });

  const token = assinarToken({ id: usuario.id, tenantId: tenant.id, papel: usuario.papel });
  res.status(201).json({ token });
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }
  const { email, senha } = parse.data;

  const usuario = await prisma.usuario.findUnique({ where: { email }, include: { tenant: true } });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  if (!usuario.tenant.ativo) {
    return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = assinarToken({ id: usuario.id, tenantId: usuario.tenantId, papel: usuario.papel });
  res.json({ token });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !usuario.ativo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const tenant = await prisma.tenant.findUnique({ where: { id: usuario.tenantId } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  if (!tenant.ativo) return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });

  res.json({
    usuario: {
      id: usuario.id,
      tenantId: usuario.tenantId,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      permissoes: (usuario.permissoes as string[] | null) ?? undefined,
      raiz: usuario.raiz,
      ativo: usuario.ativo,
    },
    tenant: {
      id: tenant.id,
      nomeFantasia: tenant.nomeFantasia,
      razaoSocial: tenant.razaoSocial ?? undefined,
      cnpj: tenant.cnpj,
      telefone: tenant.telefone ?? undefined,
      email: tenant.email ?? undefined,
      planoAtual: tenant.planoAtual,
      configuracoes: {
        logoDaLojaUrl: tenant.logoDaLojaUrl,
        corPrincipalDoTema: tenant.corPrincipalDoTema,
        corPrincipalHover: tenant.corPrincipalHover ?? undefined,
        fusoHorario: tenant.fusoHorario,
        moeda: tenant.moeda,
        exigirSenhaAoAbrirCaixa: tenant.exigirSenhaAoAbrirCaixa,
      },
      criadoEm: tenant.criadoEm.toISOString(),
    },
  });
});
