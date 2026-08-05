import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/resumo', async (req, res) => {
  const { tenantId } = req.usuario!;

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const vendasDoDia = await prisma.transacao.findMany({
    where: { tenantId, tipo: 'SAIDA', timestamp: { gte: inicioDoDia } },
    include: { itens: true },
  });

  const faturamentoDoDia = Number(vendasDoDia.reduce((acc, t) => acc + Number(t.valorTotal), 0).toFixed(2));
  const quantidadeVendasDoDia = vendasDoDia.length;
  const ticketMedio = quantidadeVendasDoDia > 0 ? Number((faturamentoDoDia / quantidadeVendasDoDia).toFixed(2)) : 0;

  const acumuladoPorProduto = new Map<string, { nome: string; quantidade: number; receita: number }>();
  for (const venda of vendasDoDia) {
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
    .slice(0, 5);

  const produtosAtivos = await prisma.produto.findMany({ where: { tenantId, ativo: true } });
  const produtosComEstoqueBaixo = produtosAtivos.filter((p) => p.quantidadeEmEstoque <= p.estoqueMinimo).length;

  res.json({
    faturamentoDoDia,
    quantidadeVendasDoDia,
    ticketMedio,
    produtosMaisVendidos,
    produtosComEstoqueBaixo,
  });
});
