import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireFeaturePlano } from '../middleware/plano.js';

export const financeiroRouter = Router();
financeiroRouter.use(requireAuth, requireFeaturePlano('financeiro'));

/**
 * Datas vêm como "YYYY-MM-DD" e o Date as interpreta como meia-noite UTC —
 * por isso o limite superior também é fechado em UTC, senão em fusos
 * negativos (ex: America/Sao_Paulo) o dia final "vaza" para trás e exclui
 * lançamentos feitos mais tarde no próprio dia (mesmo bug já corrigido em
 * relatorios.routes.ts).
 */
function periodoDaQuery(req: import('express').Request): { inicio?: Date; fim?: Date } {
  const inicio = typeof req.query.inicio === 'string' ? new Date(req.query.inicio) : undefined;
  const fim = typeof req.query.fim === 'string' ? new Date(req.query.fim) : undefined;
  if (fim) fim.setUTCHours(23, 59, 59, 999);
  return { inicio, fim };
}

function serializarLancamento(l: {
  id: string;
  tenantId: string;
  tipo: string;
  categoria: string;
  descricao: string | null;
  valor: unknown;
  data: Date;
  usuarioId: string;
  criadoEm: Date;
}) {
  return {
    id: l.id,
    tenantId: l.tenantId,
    tipo: l.tipo,
    categoria: l.categoria,
    descricao: l.descricao ?? undefined,
    valor: Number(l.valor),
    data: l.data.toISOString(),
    usuarioId: l.usuarioId,
    criadoEm: l.criadoEm.toISOString(),
  };
}

financeiroRouter.get('/resumo', async (req, res) => {
  const { tenantId } = req.usuario!;
  const { inicio, fim } = periodoDaQuery(req);

  const [vendas, entradasEstoque, lancamentos] = await Promise.all([
    prisma.transacao.findMany({
      where: { tenantId, tipo: 'SAIDA', timestamp: { gte: inicio, lte: fim } },
    }),
    prisma.transacao.findMany({
      where: { tenantId, tipo: 'ENTRADA', timestamp: { gte: inicio, lte: fim } },
    }),
    prisma.lancamentoFinanceiro.findMany({
      where: { tenantId, data: { gte: inicio, lte: fim } },
    }),
  ]);

  const receitaVendas = Number(vendas.reduce((acc, v) => acc + Number(v.valorTotal), 0).toFixed(2));
  const custoEstoque = Number(entradasEstoque.reduce((acc, e) => acc + Number(e.valorTotal), 0).toFixed(2));
  const receitasAvulsas = Number(
    lancamentos.filter((l) => l.tipo === 'RECEITA').reduce((acc, l) => acc + Number(l.valor), 0).toFixed(2),
  );
  const despesasAvulsas = Number(
    lancamentos.filter((l) => l.tipo === 'DESPESA').reduce((acc, l) => acc + Number(l.valor), 0).toFixed(2),
  );
  const saldo = Number((receitaVendas + receitasAvulsas - custoEstoque - despesasAvulsas).toFixed(2));

  res.json({ receitaVendas, custoEstoque, receitasAvulsas, despesasAvulsas, saldo });
});

financeiroRouter.get('/lancamentos', async (req, res) => {
  const { tenantId } = req.usuario!;
  const { inicio, fim } = periodoDaQuery(req);

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { tenantId, data: { gte: inicio, lte: fim } },
    orderBy: { data: 'desc' },
  });

  res.json(lancamentos.map(serializarLancamento));
});

const lancamentoSchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA']),
  categoria: z.string().min(1),
  descricao: z.string().optional(),
  valor: z.number().positive(),
  data: z.string().min(1),
});

financeiroRouter.post('/lancamentos', async (req, res) => {
  const { tenantId, id: usuarioId } = req.usuario!;
  const parse = lancamentoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const { tipo, categoria, descricao, valor, data } = parse.data;

  const lancamento = await prisma.lancamentoFinanceiro.create({
    data: { tenantId, tipo, categoria, descricao, valor, data: new Date(data), usuarioId },
  });

  res.status(201).json(serializarLancamento(lancamento));
});

financeiroRouter.delete('/lancamentos/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const lancamento = await prisma.lancamentoFinanceiro.findFirst({ where: { id: req.params.id, tenantId } });
  if (!lancamento) return res.status(404).json({ erro: 'Lançamento não encontrado.' });

  await prisma.lancamentoFinanceiro.delete({ where: { id: lancamento.id } });
  res.status(204).send();
});
