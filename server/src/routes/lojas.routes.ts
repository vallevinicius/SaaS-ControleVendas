import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireContaPrincipal } from '../middleware/contaPrincipal.js';
import { requireFeaturePlano } from '../middleware/plano.js';
import { registrarAuditoria } from '../lib/auditoria.js';

export const lojasRouter = Router();
lojasRouter.use(requireAuth, requireContaPrincipal, requireFeaturePlano('multiLoja'));

const novaLojaSchema = z.object({
  nomeFantasia: z.string().min(2),
  cnpj: z.string().min(1),
});

/** Criação self-service de uma loja adicional pra mesma empresa (plano
 * ENTERPRISE) — quem cria já sai com acesso a ela, sem precisar de um novo
 * login (ver AcessoLoja e POST /auth/trocar-loja). */
lojasRouter.post('/', async (req, res) => {
  const parse = novaLojaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }
  const { nomeFantasia, cnpj } = parse.data;

  const cnpjExistente = await prisma.tenant.findUnique({ where: { cnpj } });
  if (cnpjExistente) {
    return res.status(409).json({ erro: 'Já existe uma loja cadastrada com este CNPJ.' });
  }

  const lojaOrigem = await prisma.tenant.findUnique({ where: { id: req.usuario!.tenantId } });
  if (!lojaOrigem) return res.status(404).json({ erro: 'Loja não encontrada.' });

  const novaLoja = await prisma.$transaction(async (tx) => {
    const loja = await tx.tenant.create({
      data: {
        empresaId: lojaOrigem.empresaId,
        nomeFantasia,
        cnpj,
        logoDaLojaUrl: lojaOrigem.logoDaLojaUrl,
        corPrincipalDoTema: lojaOrigem.corPrincipalDoTema,
        corPrincipalHover: lojaOrigem.corPrincipalHover ?? undefined,
        fusoHorario: lojaOrigem.fusoHorario,
        moeda: lojaOrigem.moeda,
      },
    });
    await tx.categoria.create({ data: { tenantId: loja.id, nome: 'Geral' } });
    await tx.acessoLoja.create({ data: { usuarioId: req.usuario!.id, tenantId: loja.id } });
    return loja;
  });

  await registrarAuditoria(lojaOrigem.id, req.usuario!.id, 'loja.criar', novaLoja.nomeFantasia);
  res.status(201).json({ id: novaLoja.id, nomeFantasia: novaLoja.nomeFantasia });
});

const concederAcessoSchema = z.object({ usuarioId: z.string().min(1) });

/** Concede a um usuário de qualquer loja da mesma empresa acesso a outra
 * loja específica (ver AcessoLoja). Só o dono (conta principal) concede. */
lojasRouter.post('/:tenantId/acessos', async (req, res) => {
  const parse = concederAcessoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  const lojaAtual = await prisma.tenant.findUnique({ where: { id: req.usuario!.tenantId } });
  if (!lojaAtual) return res.status(404).json({ erro: 'Loja não encontrada.' });

  const lojaAlvo = await prisma.tenant.findUnique({ where: { id: req.params.tenantId } });
  if (!lojaAlvo || lojaAlvo.empresaId !== lojaAtual.empresaId) {
    return res.status(404).json({ erro: 'Loja não encontrada.' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: parse.data.usuarioId },
    include: { tenant: true },
  });
  if (!usuario || usuario.tenant.empresaId !== lojaAtual.empresaId) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  await prisma.acessoLoja.upsert({
    where: { usuarioId_tenantId: { usuarioId: usuario.id, tenantId: lojaAlvo.id } },
    update: {},
    create: { usuarioId: usuario.id, tenantId: lojaAlvo.id },
  });

  await registrarAuditoria(
    lojaAtual.id,
    req.usuario!.id,
    'loja.concederAcesso',
    `${usuario.nome} → ${lojaAlvo.nomeFantasia}`,
  );
  res.status(201).json({ ok: true });
});
