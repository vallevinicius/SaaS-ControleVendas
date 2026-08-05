import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const categoriasRouter = Router();
categoriasRouter.use(requireAuth);

categoriasRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const categorias = await prisma.categoria.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } });
  res.json(
    categorias.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      nome: c.nome,
      atributosCustomizados: c.atributosCustomizados ?? undefined,
    })),
  );
});

const categoriaSchema = z.object({
  nome: z.string().min(1),
  atributosCustomizados: z.array(z.object({ chave: z.string(), tipo: z.enum(['TEXTO', 'NUMERO', 'DATA', 'BOOLEANO']) })).optional(),
});

categoriasRouter.post('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = categoriaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const categoria = await prisma.categoria.create({ data: { ...parse.data, tenantId } });
  res.status(201).json({
    id: categoria.id,
    tenantId: categoria.tenantId,
    nome: categoria.nome,
    atributosCustomizados: categoria.atributosCustomizados ?? undefined,
  });
});
