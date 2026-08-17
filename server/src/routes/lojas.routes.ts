import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireContaPrincipal } from '../middleware/contaPrincipal.js';
import { requireFeaturePlano } from '../middleware/plano.js';

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

  res.status(201).json({ id: novaLoja.id, nomeFantasia: novaLoja.nomeFantasia });
});
