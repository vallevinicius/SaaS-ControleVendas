import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireContaPrincipal } from '../middleware/contaPrincipal.js';
import { registrarAuditoria } from '../lib/auditoria.js';

export const tenantRouter = Router();
tenantRouter.use(requireAuth);

const aparenciaSchema = z.object({
  corPrincipalDoTema: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use um hex de 6 dígitos, ex: #10B981'),
  corPrincipalHover: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  logoDaLojaUrl: z.string().url().optional(),
});

/** Personalização visual da loja (cor de destaque/logo) — só a conta
 * principal muda, e vale só pra loja atual (cada loja tem a sua). */
tenantRouter.put('/aparencia', requireContaPrincipal, async (req, res) => {
  const parse = aparenciaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const { tenantId, id: usuarioId } = req.usuario!;
  const atualizado = await prisma.tenant.update({
    where: { id: tenantId },
    data: parse.data,
  });

  await registrarAuditoria(tenantId, usuarioId, 'loja.personalizarAparencia', parse.data.corPrincipalDoTema);

  res.json({
    logoDaLojaUrl: atualizado.logoDaLojaUrl,
    corPrincipalDoTema: atualizado.corPrincipalDoTema,
    corPrincipalHover: atualizado.corPrincipalHover ?? undefined,
  });
});
