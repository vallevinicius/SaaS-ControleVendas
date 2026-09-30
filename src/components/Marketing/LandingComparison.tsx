import { LIMITES_POR_PLANO } from '@/utils/planos';
import type { PlanoSaaS } from '@/types';

const COLUNAS: { plano: PlanoSaaS; rotulo: string }[] = [
  { plano: 'STARTER', rotulo: 'Starter' },
  { plano: 'PRO', rotulo: 'Pro' },
  { plano: 'ENTERPRISE', rotulo: 'Enterprise' },
];

type Valor = string | boolean;

const LINHAS: { rotulo: string; valor: (plano: PlanoSaaS) => Valor }[] = [
  { rotulo: 'Usuários', valor: (p) => LIMITES_POR_PLANO[p].maxUsuarios?.toString() ?? 'Ilimitados' },
  { rotulo: 'Produtos', valor: (p) => LIMITES_POR_PLANO[p].maxProdutos?.toString() ?? 'Ilimitados' },
  { rotulo: 'PDV e controle de caixa', valor: () => true },
  { rotulo: 'Estoque', valor: () => true },
  { rotulo: 'Cadastro de clientes', valor: () => true },
  { rotulo: 'Financeiro', valor: (p) => LIMITES_POR_PLANO[p].features.financeiro },
  { rotulo: 'Relatórios', valor: (p) => LIMITES_POR_PLANO[p].features.relatorios },
  { rotulo: 'Vendedores e comissão', valor: (p) => LIMITES_POR_PLANO[p].features.vendedores },
  { rotulo: 'Múltiplas lojas', valor: (p) => LIMITES_POR_PLANO[p].features.multiLoja },
];

function Celula({ valor }: { valor: Valor }) {
  if (typeof valor === 'string') return <span className="font-medium text-ink-100">{valor}</span>;
  return valor ? (
    <span aria-label="Incluído" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-tenant-soft text-xs text-tenant">
      ✓
    </span>
  ) : (
    <span aria-label="Não incluído" className="text-ink-600">
      –
    </span>
  );
}

/** Tabela comparativa lida direto de LIMITES_POR_PLANO, então acompanha os
 * limites reais dos planos sem precisar atualizar em dois lugares. */
export function LandingComparison() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <h3 className="text-center font-display text-xl font-semibold text-ink-100">Compare os planos</h3>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-700 bg-ink-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-left">
              <th scope="col" className="px-5 py-4 font-medium text-ink-400">
                Recurso
              </th>
              {COLUNAS.map((c) => (
                <th key={c.plano} scope="col" className="px-5 py-4 text-center font-display font-semibold text-ink-100">
                  {c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINHAS.map((linha) => (
              <tr key={linha.rotulo} className="border-b border-ink-700 last:border-0 hover:bg-ink-700/30">
                <th scope="row" className="px-5 py-3.5 text-left font-normal text-ink-300">
                  {linha.rotulo}
                </th>
                {COLUNAS.map((c) => (
                  <td key={c.plano} className="px-5 py-3.5 text-center">
                    <Celula valor={linha.valor(c.plano)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
