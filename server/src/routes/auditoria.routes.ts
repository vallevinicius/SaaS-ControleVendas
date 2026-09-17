import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireContaPrincipal } from '../middleware/contaPrincipal.js';
import { lerPaginacao, montarResposta } from '../lib/paginacao.js';

export const auditoriaRouter = Router();
// Só a conta principal (dono) vê a trilha de auditoria da loja.
auditoriaRouter.use(requireAuth, requireContaPrincipal);

auditoriaRouter.get('/', async (req, res) => {
  const { tenantId } = req.usuario!;
  const { pagina, tamanho } = lerPaginacao(req.query);

  const [registros, total] = await Promise.all([
    prisma.registroAuditoria.findMany({
      where: { tenantId },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * tamanho,
      take: tamanho,
    }),
    prisma.registroAuditoria.count({ where: { tenantId } }),
  ]);

  res.json(
    montarResposta(
      registros.map((r) => ({
        id: r.id,
        usuarioNome: r.usuarioNome,
        acao: r.acao,
        detalhe: r.detalhe ?? undefined,
        criadoEm: r.criadoEm.toISOString(),
      })),
      total,
      pagina,
      tamanho,
    ),
  );
});
