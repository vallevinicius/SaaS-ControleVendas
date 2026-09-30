import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { useTenant } from '@/contexts/TenantContext';
import { getResumoFinanceiro, getLancamentos } from '@/services/apiService';
import { formatarMoeda, formatarDataHora } from '@/utils/formatters';
import type { LancamentoFinanceiro, ResumoFinanceiro } from '@/types';
import { FiltroPeriodo, hoje, inicioDoMesAtual } from './FiltroPeriodo';

function Cartao({ rotulo, valor, tom, destaque }: { rotulo: string; valor: string; tom?: 'verde' | 'vermelho'; destaque?: boolean }) {
  const cor = destaque ? 'text-tenant' : tom === 'verde' ? 'text-emerald-400' : tom === 'vermelho' ? 'text-red-400' : 'text-ink-100';
  return (
    <div className={['rounded-xl border p-5', destaque ? 'border-tenant bg-tenant-soft' : 'border-ink-700 bg-ink-800'].join(' ')}>
      <p className={['text-xs font-medium uppercase tracking-wide', destaque ? 'text-ink-300' : 'text-ink-400'].join(' ')}>{rotulo}</p>
      <p className={['mt-2 font-display text-xl font-semibold', cor].join(' ')}>{valor}</p>
    </div>
  );
}

/** Financeiro > Visão geral: números do período e os últimos lançamentos. A
 * lista completa (e o formulário de novo lançamento) fica em "Lançamentos". */
export function FinanceiroScreen() {
  const { tenant } = useTenant();
  const [inicio, setInicio] = useState(inicioDoMesAtual());
  const [fim, setFim] = useState(hoje());
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [recentes, setRecentes] = useState<LancamentoFinanceiro[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const [resumoCarregado, lancamentos] = await Promise.all([getResumoFinanceiro(inicio, fim), getLancamentos(inicio, fim)]);
    setResumo(resumoCarregado);
    setRecentes(lancamentos.slice(0, 5));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entradas = resumo ? resumo.receitaVendas + resumo.receitasAvulsas : 0;
  const saidas = resumo ? resumo.custoEstoque + resumo.despesasAvulsas : 0;
  const percentualEntradas = entradas + saidas > 0 ? (entradas / (entradas + saidas)) * 100 : 50;

  return (
    <AppLayout titulo="Financeiro" subtitulo="Visão geral do fluxo de caixa">
      <FiltroPeriodo inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} onFiltrar={carregar} />

      {carregando || !resumo ? (
        <LoadingState mensagem="Calculando o financeiro…" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Cartao rotulo="Receita de vendas" valor={formatarMoeda(resumo.receitaVendas, tenant)} tom="verde" />
            <Cartao rotulo="Custo de estoque" valor={formatarMoeda(resumo.custoEstoque, tenant)} tom="vermelho" />
            <Cartao rotulo="Receitas avulsas" valor={formatarMoeda(resumo.receitasAvulsas, tenant)} tom="verde" />
            <Cartao rotulo="Despesas avulsas" valor={formatarMoeda(resumo.despesasAvulsas, tenant)} tom="vermelho" />
            <Cartao rotulo="Saldo do período" valor={formatarMoeda(resumo.saldo, tenant)} destaque />
          </div>

          <div className="rounded-xl border border-ink-700 bg-ink-800 p-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-ink-100">Entradas x saídas</p>
              <p className="text-ink-400">
                {formatarMoeda(entradas, tenant)} entrou · {formatarMoeda(saidas, tenant)} saiu
              </p>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-red-500/40">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${percentualEntradas}%` }} />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800/40">
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-800 px-5 py-3.5">
              <p className="font-display text-sm font-semibold text-ink-100">Últimos lançamentos</p>
              <Link to="/financeiro/lancamentos" className="text-xs font-medium text-tenant hover:underline">
                Ver todos
              </Link>
            </div>
            {recentes.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-ink-400">Nenhum lançamento avulso no período selecionado.</p>
            ) : (
              <ul className="divide-y divide-ink-700">
                {recentes.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-ink-100">{l.categoria}</p>
                      <p className="text-xs text-ink-500">{formatarDataHora(l.data, tenant)}</p>
                    </div>
                    <p className={['font-mono', l.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
                      {l.tipo === 'RECEITA' ? '+' : '-'} {formatarMoeda(l.valor, tenant)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
