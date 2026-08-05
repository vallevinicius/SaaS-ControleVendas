import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const clientesRouter = Router();
clientesRouter.use(requireAuth);

function serializarCliente(c: {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpfCnpj: string | null;
  criadoEm: Date;
}) {
  return {
    id: c.id,
    tenantId: c.tenantId,
    nome: c.nome,
    telefone: c.telefone ?? undefined,
    email: c.email ?? undefined,
    cpfCnpj: c.cpfCnpj ?? undefined,
    criadoEm: c.criadoEm.toISOString(),
  };
}

clientesRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const termo = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  const clientes = await prisma.cliente.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } });
  const filtrados = termo ? clientes.filter((c) => c.nome.toLowerCase().includes(termo)) : clientes;

  res.json(filtrados.map(serializarCliente));
});

const clienteSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  cpfCnpj: z.string().optional(),
});

clientesRouter.post('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = clienteSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const cliente = await prisma.cliente.create({
    data: { tenantId, nome: parse.data.nome, telefone: parse.data.telefone, email: parse.data.email || undefined, cpfCnpj: parse.data.cpfCnpj },
  });
  res.status(201).json(serializarCliente(cliente));
});

clientesRouter.put('/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const parse = clienteSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: req.params.id, tenantId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const atualizado = await prisma.cliente.update({
    where: { id: cliente.id },
    data: { ...parse.data, email: parse.data.email || undefined },
  });
  res.json(serializarCliente(atualizado));
});

clientesRouter.delete('/:id', async (req, res) => {
  const { tenantId } = req.usuario!;
  const cliente = await prisma.cliente.findFirst({ where: { id: req.params.id, tenantId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  await prisma.cliente.delete({ where: { id: cliente.id } });
  res.status(204).send();
});
