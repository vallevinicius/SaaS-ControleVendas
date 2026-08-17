import type { PlanoSaaS } from '@prisma/client';

/** Duração do trial dado no cadastro self-service (hoje: STARTER). O trial
 * é uma propriedade de `Empresa.trialExpiraEm`, independente do plano — não
 * é exclusivo do plano FREE (que hoje só existe como opção residual
 * atribuível manualmente pelo admin, ex: conta de cortesia). */
export const DIAS_TRIAL = 14;

export type FeaturePlano = 'financeiro' | 'relatorios' | 'vendedores' | 'multiLoja';

export interface LimitesPlano {
  maxUsuarios: number | null;
  maxProdutos: number | null;
  features: Record<FeaturePlano, boolean>;
}

/** Fonte única de verdade dos limites/recursos de cada plano do SaaS. */
export const LIMITES_POR_PLANO: Record<PlanoSaaS, LimitesPlano> = {
  FREE: {
    maxUsuarios: 1,
    maxProdutos: 30,
    features: { financeiro: false, relatorios: false, vendedores: false, multiLoja: false },
  },
  STARTER: {
    maxUsuarios: 3,
    maxProdutos: 300,
    features: { financeiro: true, relatorios: true, vendedores: false, multiLoja: false },
  },
  PRO: {
    maxUsuarios: 10,
    maxProdutos: null,
    features: { financeiro: true, relatorios: true, vendedores: true, multiLoja: false },
  },
  ENTERPRISE: {
    maxUsuarios: null,
    maxProdutos: null,
    features: { financeiro: true, relatorios: true, vendedores: true, multiLoja: true },
  },
};

export function calcularTrialExpiraEm(): Date {
  const data = new Date();
  data.setDate(data.getDate() + DIAS_TRIAL);
  return data;
}
