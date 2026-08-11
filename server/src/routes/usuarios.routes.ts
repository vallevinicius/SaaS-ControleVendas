import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const usuariosRouter = Router();
usuariosRouter.use(requireAuth);

const TELAS_VALIDAS = ['dashboard', 'pdv', 'estoque', 'financeiro', 'clientes', 'relatorios'] as const;
const permissoesSchema = z.array(z.enum(TELAS_VALIDAS));

function serializarUsuario(u: {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: string;
  permissoes: unknown;
  raiz: boolean;
  ativo: boolean;
  criadoEm: Date;
}) {
  return {
    id: u.id,
    tenantId: u.tenantId,
    nome: u.nome,
    email: u.email,
    papel: u.papel,
    permissoes: (u.permissoes as string[] | null) ?? undefined,
    raiz: u.raiz,
    ativo: u.ativo,
    criadoEm: u.criadoEm.toISOString(),
  };
}

usuariosRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const usuarios = await prisma.usuario.findMany({ where: { tenantId }, orderBy: { nome: 'asc' } });
  res.json(usuarios.map(serializarUsuario));
});

const novoUsuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: z.enum(['ADMIN', 'GERENTE', 'OPERADOR_CAIXA']),
  permissoes: permissoesSchema.optional(),
});

usuariosRouter.post('/', async (req, res) => {
  const { tenantId, papel: papelSolicitante } = req.usuario!;
  if (papelSolicitante !== 'ADMIN') {
    return res.status(403).json({ erro: 'Só administradores da loja podem criar novos logins.' });
  }

  const parse = novoUsuarioSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const existente = await prisma.usuario.findUnique({ where: { email: parse.data.email } });
  if (existente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }

  const senhaHash = await bcrypt.hash(parse.data.senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      tenantId,
      nome: parse.data.nome,
      email: parse.data.email,
      senhaHash,
      papel: parse.data.papel,
      permissoes: parse.data.permissoes ?? [],
    },
  });

  res.status(201).json(serializarUsuario(usuario));
});

const ativoSchema = z.object({ ativo: z.boolean() });

usuariosRouter.put('/:id/ativo', async (req, res) => {
  const { tenantId, papel: papelSolicitante, id: idSolicitante } = req.usuario!;
  if (papelSolicitante !== 'ADMIN') {
    return res.status(403).json({ erro: 'Só administradores da loja podem alterar logins.' });
  }
  if (req.params.id === idSolicitante) {
    return res.status(400).json({ erro: 'Você não pode desativar seu próprio login.' });
  }

  const parse = ativoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Valor inválido.' });
  }

  const usuario = await prisma.usuario.findFirst({ where: { id: req.params.id, tenantId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (usuario.raiz && !parse.data.ativo) {
    return res.status(400).json({ erro: 'A conta principal da loja não pode ser desativada.' });
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ativo: parse.data.ativo },
  });
  res.json(serializarUsuario(atualizado));
});

usuariosRouter.put('/:id/permissoes', async (req, res) => {
  const { tenantId, papel: papelSolicitante } = req.usuario!;
  if (papelSolicitante !== 'ADMIN') {
    return res.status(403).json({ erro: 'Só administradores da loja podem alterar permissões.' });
  }

  const parse = permissoesSchema.safeParse(req.body?.permissoes);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Permissões inválidas.', detalhes: parse.error.flatten() });
  }

  const usuario = await prisma.usuario.findFirst({ where: { id: req.params.id, tenantId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { permissoes: parse.data },
  });
  res.json(serializarUsuario(atualizado));
});
