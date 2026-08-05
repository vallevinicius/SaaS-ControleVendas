import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const estoqueRouter = Router();
estoqueRouter.use(requireAuth);

const entradaSchema = z.object({
  productId: z.string().min(1),
  quantidade: z.number().int().positive(),
  precoCustoUnitario: z.number().nonnegative().optional(),
  observacao: z.string().optional(),
});

estoqueRouter.post('/entrada', async (req, res) => {
  const { tenantId, id: usuarioId } = req.usuario!;
  const parse = entradaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }
  const { productId, quantidade, precoCustoUnitario, observacao } = parse.data;

  try {
    const transacao = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findFirst({ where: { id: productId, tenantId } });
      if (!produto) throw new Error('Produto não encontrado.');

      const custoUnitario = precoCustoUnitario ?? Number(produto.precoCusto);

      await tx.produto.update({
        where: { id: produto.id },
        data: {
          quantidadeEmEstoque: { increment: quantidade },
          precoCusto: precoCustoUnitario ?? undefined,
        },
      });

      return tx.transacao.create({
        data: {
          tenantId,
          tipo: 'ENTRADA',
          valorTotal: Number((custoUnitario * quantidade).toFixed(2)),
          desconto: 0,
          taxas: 0,
          usuarioId,
          observacao,
          itens: {
            create: [
              {
                productId: produto.id,
                nomeProdutoSnapshot: produto.nome,
                quantidade,
                valorUnitarioPraticado: custoUnitario,
                subtotal: Number((custoUnitario * quantidade).toFixed(2)),
              },
            ],
          },
        },
        include: { itens: true },
      });
    });

    res.status(201).json({
      id: transacao.id,
      tenantId: transacao.tenantId,
      tipo: transacao.tipo,
      timestamp: transacao.timestamp.toISOString(),
      valorTotal: Number(transacao.valorTotal),
    });
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao registrar entrada de estoque.' });
  }
});
