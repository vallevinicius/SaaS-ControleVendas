import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireContaPrincipal } from '../middleware/contaPrincipal.js';
import { registrarAuditoria } from '../lib/auditoria.js';

export const tenantRouter = Router();
tenantRouter.use(requireAuth);

const corHex = /^#[0-9a-fA-F]{6}$/;

const aparenciaSchema = z.object({
  corPrincipalDoTema: z.string().regex(corHex, 'Use um hex de 6 dígitos, ex: #10B981'),
  // null = voltar a calcular o hover automaticamente a partir da cor principal.
  corPrincipalHover: z.string().regex(corHex).nullable().optional(),
  // Aceita tanto um link (imagem já hospedada) quanto uma imagem enviada do
  // computador, convertida em base64 no front (data URL) — sem depender de
  // um serviço externo de armazenamento de arquivos.
  logoDaLojaUrl: z
    .string()
    .max(2_000_000, 'Imagem muito grande.')
    .refine((v) => /^https?:\/\//.test(v) || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/.test(v), {
      message: 'Logo inválida.',
    })
    .optional(),
});

/** Personalização visual da loja (cor de destaque/logo) — só a conta
 * principal muda, e vale só pra loja atual (cada loja tem a sua). */
tenantRouter.put('/aparencia', requireContaPrincipal, async (req, res) => {
  const parse = aparenciaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos.', detalhes: parse.error.flatten() });
  }

  const { tenantId, id: usuarioId } = req.usuario!;
  const { corPrincipalDoTema, corPrincipalHover, logoDaLojaUrl } = parse.data;
  const atualizado = await prisma.tenant.update({
    where: { id: tenantId },
    data: { corPrincipalDoTema, corPrincipalHover, logoDaLojaUrl },
  });

  await registrarAuditoria(tenantId, usuarioId, 'loja.personalizarAparencia', parse.data.corPrincipalDoTema);

  res.json({
    logoDaLojaUrl: atualizado.logoDaLojaUrl,
    corPrincipalDoTema: atualizado.corPrincipalDoTema,
    corPrincipalHover: atualizado.corPrincipalHover ?? undefined,
  });
});
