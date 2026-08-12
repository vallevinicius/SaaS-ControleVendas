import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const vendedoresRouter = Router();
vendedoresRouter.use(requireAuth);

// Gerenciar vendedores (criar/editar/desativar) é restrito à conta principal
// da loja — outros logins (mesmo ADMIN) só podem listar, pra escolher o
// vendedor na hora de vender no PDV.
async function requireContaPrincipal(req: Request, res: Response, next: NextFunction) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id }, select: { raiz: true } });
  if (!usuario?.raiz) {
    return res.status(403).json({ erro: 'Só a conta principal da loja pode gerenciar vendedores.' });
  }
  next();
}

function serializarVendedor(v: {
  id: string;
  tenantId: string;
  nome: string;
  comissaoPercentual: unknown;
  ativo: boolean;
  criadoEm: Date;
}) {
  return {
    id: v.id,
    tenantId: v.tenantId,
    nome: v.nome,
    comissaoPercentual: Number(v.comissaoPercentual),
    ativo: v.ativo,
    criadoEm: v.criadoEm.toISOString(),
  };
}

vendedoresRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const vendedores = await prisma.vendedor.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } });
  res.json(vendedores.map(serializarVendedor));
});

const vendedorSchema = z.object({
  nome: z.string().min(1),
  comissaoPercentual: z.number().min(0).max(100).optional(),
});

vendedoresRouter.post('/', requireContaPrincipal, async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = vendedorSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const vendedor = await prisma.vendedor.create({
    data: { tenantId, nome: parse.data.nome, comissaoPercentual: parse.data.comissaoPercentual ?? 0 },
  });
  res.status(201).json(serializarVendedor(vendedor));
});

const vendedorUpdateSchema = vendedorSchema.partial().extend({ ativo: z.boolean().optional() });

vendedoresRouter.put('/:id', requireContaPrincipal, async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = vendedorUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const vendedor = await prisma.vendedor.findFirst({ where: { id: req.params.id, tenantId } });
  if (!vendedor) return res.status(404).json({ erro: 'Vendedor não encontrado.' });

  const atualizado = await prisma.vendedor.update({ where: { id: vendedor.id }, data: parse.data });
  res.json(serializarVendedor(atualizado));
});
