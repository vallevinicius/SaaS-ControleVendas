import type { PlanoSaaS, TelaComPermissao } from '@/types';

export type FeaturePlano = 'financeiro' | 'relatorios' | 'vendedores' | 'multiLoja';

export interface LimitesPlano {
  maxUsuarios: number | null;
  maxProdutos: number | null;
  features: Record<FeaturePlano, boolean>;
}

/** Espelha server/src/config/planos.ts — mantenha os dois em sincronia. */
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

const ROTULOS_PLANO: Record<PlanoSaaS, string> = {
  FREE: 'Free (cortesia)',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export function descricaoPlano(plano: PlanoSaaS): string {
  const { maxUsuarios, maxProdutos, features } = LIMITES_POR_PLANO[plano];
  const partes = [
    `${maxUsuarios ?? 'usuários ilimitados'}${maxUsuarios ? ' usuário(s)' : ''}`,
    `${maxProdutos ?? 'produtos ilimitados'}${maxProdutos ? ' produto(s)' : ''}`,
  ];
  if (features.financeiro) partes.push('Financeiro');
  if (features.relatorios) partes.push('Relatórios');
  if (features.vendedores) partes.push('Vendedores/comissão');
  if (features.multiLoja) partes.push('Múltiplas lojas');
  return `${ROTULOS_PLANO[plano]} — ${partes.join(' · ')}`;
}

export function planoPermiteMultiLoja(plano: PlanoSaaS): boolean {
  return LIMITES_POR_PLANO[plano].features.multiLoja;
}

/** Telas que são gated por feature de plano — as demais (dashboard/pdv/estoque/clientes)
 * estão liberadas em todos os planos. */
const FEATURE_POR_TELA: Partial<Record<TelaComPermissao, FeaturePlano>> = {
  financeiro: 'financeiro',
  relatorios: 'relatorios',
  vendedores: 'vendedores',
};

export function planoPermiteTela(plano: PlanoSaaS, tela: TelaComPermissao): boolean {
  const feature = FEATURE_POR_TELA[tela];
  if (!feature) return true;
  return LIMITES_POR_PLANO[plano].features[feature];
}

/** Dias restantes de trial (arredondado pra cima). Null se não estiver em trial. */
export function diasRestantesTrial(trialExpiraEm?: string): number | null {
  if (!trialExpiraEm) return null;
  const diffMs = new Date(trialExpiraEm).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
