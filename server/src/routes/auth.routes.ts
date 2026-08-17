import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { assinarToken, requireAuth } from '../middleware/auth.js';
import { calcularTrialExpiraEm, LIMITES_POR_PLANO } from '../config/planos.js';

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
    // Cadastro self-service já entra no STARTER, com um trial — dá pra
    // sentir o valor real do plano (Financeiro, Relatórios) em vez de uma
    // versão capada, o que converte melhor do que um FREE permanente.
    const empresa = await tx.empresa.create({
      data: {
        nome: nomeFantasia,
        planoAtual: 'STARTER',
        trialExpiraEm: calcularTrialExpiraEm(),
      },
    });
    const tenant = await tx.tenant.create({
      data: {
        empresaId: empresa.id,
        nomeFantasia,
        cnpj,
        telefone: telefone || undefined,
        email: emailContato || undefined,
        logoDaLojaUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`,
        corPrincipalDoTema: '#10B981',
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

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { tenant: { include: { empresa: true } } },
  });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  if (!usuario.tenant.empresa.ativo) {
    return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });
  }
  if (usuario.tenant.empresa.trialExpiraEm && usuario.tenant.empresa.trialExpiraEm < new Date()) {
    return res.status(403).json({ erro: 'Seu teste grátis expirou. Fale com a gente para continuar usando.' });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const token = assinarToken({ id: usuario.id, tenantId: usuario.tenantId, papel: usuario.papel });
  res.json({ token });
});

/** Confere se o usuário pode acessar a loja `tenantId`: é a loja de origem
 * dele (Usuario.tenantId, sempre permitida) ou ele tem um AcessoLoja
 * explícito pra ela E o plano atual da empresa ainda cobre múltiplas lojas.
 * Se a empresa foi rebaixada de ENTERPRISE, as lojas extras ficam
 * inacessíveis (dados preservados, só o acesso é suspenso) até promover de
 * volta — só a loja de origem continua disponível. */
async function possuiAcessoALoja(usuarioId: string, tenantIdHome: string, tenantId: string): Promise<boolean> {
  if (tenantId === tenantIdHome) return true;

  const acesso = await prisma.acessoLoja.findUnique({
    where: { usuarioId_tenantId: { usuarioId, tenantId } },
  });
  if (!acesso) return false;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { empresa: { select: { planoAtual: true } } },
  });
  if (!tenant) return false;
  return LIMITES_POR_PLANO[tenant.empresa.planoAtual].features.multiLoja;
}

authRouter.get('/me', requireAuth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !usuario.ativo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // A loja ativa vem do token (pode ser diferente da loja de origem do
  // usuário, se ele trocou de loja — ver POST /auth/trocar-loja), não da
  // coluna Usuario.tenantId.
  const tenantIdAtivo = req.usuario!.tenantId;
  const temAcesso = await possuiAcessoALoja(usuario.id, usuario.tenantId, tenantIdAtivo);
  if (!temAcesso) return res.status(403).json({ erro: 'Você não tem mais acesso a esta loja.' });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantIdAtivo }, include: { empresa: true } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  if (!tenant.empresa.ativo) return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });
  if (tenant.empresa.trialExpiraEm && tenant.empresa.trialExpiraEm < new Date()) {
    return res.status(403).json({ erro: 'Seu teste grátis expirou. Fale com a gente para continuar usando.' });
  }

  // As lojas extras (via AcessoLoja) só aparecem no seletor enquanto o plano
  // da empresa cobrir multiLoja — se foi rebaixada, elas somem da lista (os
  // dados continuam intactos, só ficam temporariamente inacessíveis).
  const multiLojaAtivo = LIMITES_POR_PLANO[tenant.empresa.planoAtual].features.multiLoja;
  const acessosExtras = multiLojaAtivo
    ? await prisma.acessoLoja.findMany({
        where: { usuarioId: usuario.id },
        include: { tenant: { select: { id: true, nomeFantasia: true } } },
      })
    : [];
  const lojaHome =
    usuario.tenantId === tenant.id
      ? { id: tenant.id, nomeFantasia: tenant.nomeFantasia }
      : await prisma.tenant.findUnique({ where: { id: usuario.tenantId }, select: { id: true, nomeFantasia: true } });
  const lojas = [lojaHome, ...acessosExtras.map((a) => a.tenant)].filter(
    (l): l is { id: string; nomeFantasia: string } => Boolean(l),
  );

  res.json({
    usuario: {
      id: usuario.id,
      tenantId: tenant.id,
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
      planoAtual: tenant.empresa.planoAtual,
      trialExpiraEm: tenant.empresa.trialExpiraEm?.toISOString() ?? undefined,
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
    lojas,
  });
});

const trocarLojaSchema = z.object({ tenantId: z.string().min(1) });

authRouter.post('/trocar-loja', requireAuth, async (req, res) => {
  const parse = trocarLojaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Loja inválida.' });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !usuario.ativo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const temAcesso = await possuiAcessoALoja(usuario.id, usuario.tenantId, parse.data.tenantId);
  if (!temAcesso) return res.status(403).json({ erro: 'Você não tem acesso a essa loja.' });

  const token = assinarToken({ id: usuario.id, tenantId: parse.data.tenantId, papel: usuario.papel });
  res.json({ token });
});
