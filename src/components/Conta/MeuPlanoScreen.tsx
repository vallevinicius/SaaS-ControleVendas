import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { useTenant } from '@/contexts/TenantContext';
import { getUsuarios, searchProducts } from '@/services/apiService';
import { LIMITES_POR_PLANO, diasRestantesTrial } from '@/utils/planos';
import type { PlanoSaaS } from '@/types';

const ROTULOS_PLANO: Record<PlanoSaaS, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

function BarraUso({ atual, limite, rotulo }: { atual: number; limite: number | null; rotulo: string }) {
  const percentual = limite ? Math.min(100, Math.round((atual / limite) * 100)) : 0;
  const perto = limite !== null && atual / limite >= 0.8;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-300">{rotulo}</span>
        <span className={perto ? 'font-medium text-amber-400' : 'text-ink-400'}>
          {atual}
          {limite !== null ? ` / ${limite}` : ' (ilimitado)'}
        </span>
      </div>
      {limite !== null && (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
          <div
            className={['h-full rounded-full', perto ? 'bg-amber-400' : 'bg-tenant'].join(' ')}
            style={{ width: `${percentual}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function MeuPlanoScreen() {
  const { tenant, lojas } = useTenant();
  const [carregando, setCarregando] = useState(true);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const [usuarios, produtos] = await Promise.all([getUsuarios(), searchProducts('', 1, 1)]);
      setTotalUsuarios(usuarios.length);
      setTotalProdutos(produtos.total);
      setCarregando(false);
    }
    carregar();
  }, []);

  if (!tenant) return null;

  const limites = LIMITES_POR_PLANO[tenant.planoAtual];
  const dias = diasRestantesTrial(tenant.trialExpiraEm);

  return (
    <AppLayout titulo="Meu plano" subtitulo="Uso atual da sua conta e o que o plano inclui">
      {carregando ? (
        <LoadingState mensagem="Carregando…" />
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">Plano atual</p>
                <p className="font-display text-2xl font-semibold text-ink-100">{ROTULOS_PLANO[tenant.planoAtual]}</p>
              </div>
              {dias !== null && (
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium',
                    dias > 3 ? 'bg-tenant-soft text-tenant' : 'bg-amber-500/15 text-amber-400',
                  ].join(' ')}
                >
                  {dias > 0 ? `Teste grátis: faltam ${dias} dia(s)` : 'Teste grátis expirado'}
                </span>
              )}
            </div>

            <div className="mt-6 space-y-5">
              <BarraUso atual={totalUsuarios} limite={limites.maxUsuarios} rotulo="Usuários" />
              <BarraUso atual={totalProdutos} limite={limites.maxProdutos} rotulo="Produtos" />
              {limites.features.multiLoja && (
                <BarraUso atual={lojas.length} limite={null} rotulo="Lojas" />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
            <p className="mb-4 text-sm font-medium text-ink-200">O que o plano {ROTULOS_PLANO[tenant.planoAtual]} inclui</p>
            <ul className="space-y-2 text-sm">
              {[
                { rotulo: 'Financeiro', ativo: limites.features.financeiro },
                { rotulo: 'Relatórios', ativo: limites.features.relatorios },
                { rotulo: 'Vendedores e comissão', ativo: limites.features.vendedores },
                { rotulo: 'Múltiplas lojas', ativo: limites.features.multiLoja },
              ].map((item) => (
                <li key={item.rotulo} className="flex items-center gap-2">
                  <span aria-hidden className={item.ativo ? 'text-tenant' : 'text-ink-600'}>
                    {item.ativo ? '✓' : '✕'}
                  </span>
                  <span className={item.ativo ? 'text-ink-200' : 'text-ink-500 line-through'}>{item.rotulo}</span>
                </li>
              ))}
            </ul>
          </div>

          {tenant.planoAtual !== 'ENTERPRISE' && (
            <div className="rounded-xl border border-dashed border-ink-700 p-6 text-center">
              <p className="text-sm text-ink-300">Precisa de mais usuários, produtos ou lojas?</p>
              <p className="mt-1 text-xs text-ink-500">
                Fale com a Total Software para fazer upgrade do seu plano.
              </p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
