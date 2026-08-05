import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const relatoriosRouter = Router();
relatoriosRouter.use(requireAuth);

relatoriosRouter.get('/vendas', async (req, res) => {
  const { tenantId } = req.usuario!;

  // Datas vêm como "YYYY-MM-DD" e o Date as interpreta como meia-noite UTC —
  // por isso o limite superior também precisa ser fechado em UTC, senão em
  // fusos negativos (ex: America/Sao_Paulo) o dia final "vaza" para trás e
  // exclui vendas feitas mais tarde no próprio dia.
  const inicio = typeof req.query.inicio === 'string' ? new Date(req.query.inicio) : null;
  const fim = typeof req.query.fim === 'string' ? new Date(req.query.fim) : null;
  if (fim) fim.setUTCHours(23, 59, 59, 999);

  const vendas = await prisma.transacao.findMany({
    where: {
      tenantId,
      tipo: 'SAIDA',
      timestamp: {
        gte: inicio ?? undefined,
        lte: fim ?? undefined,
      },
    },
    include: { itens: true, cliente: true },
    orderBy: { timestamp: 'desc' },
  });

  const faturamentoTotal = Number(vendas.reduce((acc, v) => acc + Number(v.valorTotal), 0).toFixed(2));
  const quantidadeVendas = vendas.length;
  const ticketMedio = quantidadeVendas > 0 ? Number((faturamentoTotal / quantidadeVendas).toFixed(2)) : 0;

  const totaisPorFormaPagamento = new Map<string, number>();
  for (const v of vendas) {
    const chave = v.formaPagamento ?? 'OUTRO';
    totaisPorFormaPagamento.set(chave, (totaisPorFormaPagamento.get(chave) ?? 0) + Number(v.valorTotal));
  }

  const acumuladoPorProduto = new Map<string, { nome: string; quantidade: number; receita: number }>();
  for (const venda of vendas) {
    for (const item of venda.itens) {
      const atual = acumuladoPorProduto.get(item.productId) ?? {
        nome: item.nomeProdutoSnapshot,
        quantidade: 0,
        receita: 0,
      };
      atual.quantidade += item.quantidade;
      atual.receita += Number(item.subtotal);
      acumuladoPorProduto.set(item.productId, atual);
    }
  }

  const produtosMaisVendidos = Array.from(acumuladoPorProduto.entries())
    .map(([productId, dados]) => ({
      productId,
      nome: dados.nome,
      quantidadeVendida: dados.quantidade,
      receitaGerada: Number(dados.receita.toFixed(2)),
    }))
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    .slice(0, 10);

  res.json({
    faturamentoTotal,
    quantidadeVendas,
    ticketMedio,
    totaisPorFormaPagamento: Object.fromEntries(
      Array.from(totaisPorFormaPagamento.entries()).map(([k, v]) => [k, Number(v.toFixed(2))]),
    ),
    produtosMaisVendidos,
    vendas: vendas.map((v) => ({
      id: v.id,
      timestamp: v.timestamp.toISOString(),
      valorTotal: Number(v.valorTotal),
      formaPagamento: v.formaPagamento ?? undefined,
      clienteNome: v.cliente?.nome,
      quantidadeItens: v.itens.reduce((acc, i) => acc + i.quantidade, 0),
    })),
  });
});
