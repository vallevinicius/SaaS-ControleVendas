import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const produtosRouter = Router();
produtosRouter.use(requireAuth);

function serializarProduto(p: {
  id: string;
  tenantId: string;
  nome: string;
  sku: string;
  categoriaId: string;
  precoCusto: unknown;
  precoVenda: unknown;
  quantidadeEmEstoque: number;
  estoqueMinimo: number;
  atributosCustomizados: unknown;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    nome: p.nome,
    sku: p.sku,
    categoriaId: p.categoriaId,
    precoCusto: Number(p.precoCusto),
    precoVenda: Number(p.precoVenda),
    quantidadeEmEstoque: p.quantidadeEmEstoque,
    estoqueMinimo: p.estoqueMinimo,
    atributosCustomizados: p.atributosCustomizados ?? undefined,
    ativo: p.ativo,
    criadoEm: p.criadoEm.toISOString(),
    atualizadoEm: p.atualizadoEm.toISOString(),
  };
}

produtosRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const termo = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  const produtos = await prisma.produto.findMany({
    where: { tenantId, ativo: true },
    orderBy: { nome: 'asc' },
  });

  const filtrados = termo
    ? produtos.filter((p) => p.nome.toLowerCase().includes(termo) || p.sku.toLowerCase().includes(termo))
    : produtos;

  res.json(filtrados.map(serializarProduto));
});

produtosRouter.get('/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const produto = await prisma.produto.findFirst({ where: { id: req.params.id, tenantId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(serializarProduto(produto));
});

const produtoSchema = z.object({
  nome: z.string().min(1),
  sku: z.string().min(1),
  categoriaId: z.string().min(1),
  precoCusto: z.number().nonnegative(),
  precoVenda: z.number().nonnegative(),
  quantidadeEmEstoque: z.number().int().nonnegative(),
  estoqueMinimo: z.number().int().nonnegative(),
  atributosCustomizados: z.array(z.object({ chave: z.string(), valor: z.union([z.string(), z.number(), z.boolean()]) })).optional(),
});

produtosRouter.post('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = produtoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const skuExistente = await prisma.produto.findFirst({ where: { tenantId, sku: parse.data.sku } });
  if (skuExistente) {
    return res.status(409).json({ erro: 'Já existe um produto com este SKU.' });
  }

  const categoria = await prisma.categoria.findFirst({ where: { id: parse.data.categoriaId, tenantId } });
  if (!categoria) {
    return res.status(400).json({ erro: 'Categoria inválida.' });
  }

  const produto = await prisma.produto.create({
    data: { ...parse.data, tenantId },
  });
  res.status(201).json(serializarProduto(produto));
});

const produtoUpdateSchema = produtoSchema.partial();

produtosRouter.put('/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = produtoUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const produto = await prisma.produto.findFirst({ where: { id: req.params.id, tenantId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const atualizado = await prisma.produto.update({
    where: { id: produto.id },
    data: parse.data,
  });
  res.json(serializarProduto(atualizado));
});

produtosRouter.delete('/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const produto = await prisma.produto.findFirst({ where: { id: req.params.id, tenantId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  await prisma.produto.update({ where: { id: produto.id }, data: { ativo: false } });
  res.status(204).send();
});
