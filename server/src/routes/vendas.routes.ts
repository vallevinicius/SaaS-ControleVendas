import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const vendasRouter = Router();
vendasRouter.use(requireAuth);

function serializarTransacao(t: {
  id: string;
  tenantId: string;
  tipo: string;
  timestamp: Date;
  valorTotal: unknown;
  desconto: unknown;
  taxas: unknown;
  formaPagamento: string | null;
  usuarioId: string;
  clienteId: string | null;
  observacao: string | null;
  itens: Array<{
    productId: string;
    nomeProdutoSnapshot: string;
    quantidade: number;
    valorUnitarioPraticado: unknown;
    subtotal: unknown;
  }>;
}) {
  return {
    id: t.id,
    tenantId: t.tenantId,
    tipo: t.tipo,
    timestamp: t.timestamp.toISOString(),
    itens: t.itens.map((i) => ({
      productId: i.productId,
      nomeProdutoSnapshot: i.nomeProdutoSnapshot,
      quantidade: i.quantidade,
      valorUnitarioPraticado: Number(i.valorUnitarioPraticado),
      subtotal: Number(i.subtotal),
    })),
    valorTotal: Number(t.valorTotal),
    desconto: Number(t.desconto),
    taxas: Number(t.taxas),
    formaPagamento: t.formaPagamento ?? undefined,
    usuarioId: t.usuarioId,
    clienteId: t.clienteId ?? undefined,
    observacao: t.observacao ?? undefined,
  };
}

vendasRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const transacoes = await prisma.transacao.findMany({
    where: { tenantId, tipo: 'SAIDA' },
    include: { itens: true },
    orderBy: { timestamp: 'desc' },
  });
  res.json(transacoes.map(serializarTransacao));
});

const novaVendaSchema = z.object({
  itens: z.array(z.object({ productId: z.string().min(1), quantidade: z.number().int().positive() })).min(1),
  desconto: z.number().nonnegative().optional(),
  taxas: z.number().nonnegative().optional(),
  formaPagamento: z.enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'BOLETO', 'OUTRO']),
  clienteId: z.string().optional(),
});

vendasRouter.post('/', async (req, res) => {
  const { tenantId, id: usuarioId } = req.usuario!;
  const parse = novaVendaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }
  const { itens, desconto = 0, taxas = 0, formaPagamento, clienteId } = parse.data;

  try {
    const transacao = await prisma.$transaction(async (tx) => {
      const itensResolvidos: Array<{
        productId: string;
        nomeProdutoSnapshot: string;
        quantidade: number;
        valorUnitarioPraticado: number;
        subtotal: number;
      }> = [];

      for (const item of itens) {
        const produto = await tx.produto.findFirst({ where: { id: item.productId, tenantId } });
        if (!produto) throw new Error(`Produto ${item.productId} não encontrado.`);
        if (produto.quantidadeEmEstoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidadeEmEstoque}.`);
        }
        const valorUnitario = Number(produto.precoVenda);
        itensResolvidos.push({
          productId: produto.id,
          nomeProdutoSnapshot: produto.nome,
          quantidade: item.quantidade,
          valorUnitarioPraticado: valorUnitario,
          subtotal: Number((valorUnitario * item.quantidade).toFixed(2)),
        });
      }

      const valorBruto = itensResolvidos.reduce((acc, i) => acc + i.subtotal, 0);
      const valorTotal = Number((valorBruto - desconto + taxas).toFixed(2));

      const novaTransacao = await tx.transacao.create({
        data: {
          tenantId,
          tipo: 'SAIDA',
          valorTotal,
          desconto,
          taxas,
          formaPagamento,
          usuarioId,
          clienteId: clienteId || undefined,
          itens: { create: itensResolvidos },
        },
        include: { itens: true },
      });

      for (const item of itensResolvidos) {
        await tx.produto.update({
          where: { id: item.productId },
          data: { quantidadeEmEstoque: { decrement: item.quantidade } },
        });
      }

      return novaTransacao;
    });

    res.status(201).json(serializarTransacao(transacao));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao registrar venda.' });
  }
});
