import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { LIMITES_POR_PLANO, type FeaturePlano } from '../config/planos.js';

const NOMES_FEATURE: Record<FeaturePlano, string> = {
  financeiro: 'Financeiro',
  relatorios: 'Relatórios',
  vendedores: 'Vendedores',
  multiLoja: 'Múltiplas lojas',
};

/** Bloqueia a rota inteira se o plano da empresa não incluir a feature. */
export function requireFeaturePlano(feature: FeaturePlano) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.usuario!.tenantId },
      select: { empresa: { select: { planoAtual: true } } },
    });
    if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });

    if (!LIMITES_POR_PLANO[tenant.empresa.planoAtual].features[feature]) {
      return res.status(403).json({
        erro: `Módulo ${NOMES_FEATURE[feature]} não disponível no plano ${tenant.empresa.planoAtual}. Faça upgrade para liberar.`,
      });
    }
    next();
  };
}

/** Lança um erro com status 403 se o tenant já atingiu o limite do recurso no plano atual. */
export async function verificarLimiteRecurso(
  tenantId: string,
  tipo: 'usuarios' | 'produtos',
): Promise<{ erro: string } | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { empresa: { select: { planoAtual: true } } },
  });
  if (!tenant) return { erro: 'Loja não encontrada.' };

  const limites = LIMITES_POR_PLANO[tenant.empresa.planoAtual];
  const limite = tipo === 'usuarios' ? limites.maxUsuarios : limites.maxProdutos;
  if (limite === null) return null;

  const contagem =
    tipo === 'usuarios'
      ? await prisma.usuario.count({ where: { tenantId } })
      : await prisma.produto.count({ where: { tenantId, ativo: true } });

  if (contagem >= limite) {
    const recurso = tipo === 'usuarios' ? 'usuários' : 'produtos';
    return {
      erro: `Limite de ${limite} ${recurso} do plano ${tenant.empresa.planoAtual} atingido. Faça upgrade para adicionar mais.`,
    };
  }
  return null;
}
