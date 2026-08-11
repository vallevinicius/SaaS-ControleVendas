import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { useTenant } from '@/contexts/TenantContext';
import { getRelatorioVendas } from '@/services/apiService';
import { formatarMoeda, formatarDataHora, formatarFormaPagamento } from '@/utils/formatters';
import type { RelatorioVendas } from '@/types';

function inicioDoMesAtual(): string {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RelatoriosScreen() {
  const { tenant } = useTenant();
  const [inicio, setInicio] = useState(inicioDoMesAtual());
  const [fim, setFim] = useState(hoje());
  const [relatorio, setRelatorio] = useState<RelatorioVendas | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    setRelatorio(await getRelatorioVendas(inicio, fim));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout titulo="Relatórios" subtitulo="Vendas por período">
      <div className="mb-6 flex items-end gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4">
        <label className="block text-sm text-ink-300">
          De
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="mt-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>
        <label className="block text-sm text-ink-300">
          Até
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="mt-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>
        <button
          onClick={carregar}
          className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90"
        >
          Filtrar
        </button>
      </div>

      {carregando || !relatorio ? (
        <LoadingState mensagem="Calculando relatório…" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Faturamento no período</p>
              <p className="mt-2 font-display text-2xl font-semibold text-tenant">
                {formatarMoeda(relatorio.faturamentoTotal, tenant)}
              </p>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Vendas</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-100">{relatorio.quantidadeVendas}</p>
            </div>
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Ticket médio</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-100">
                {formatarMoeda(relatorio.ticketMedio, tenant)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="mb-4 font-display text-base font-semibold text-ink-100">Por forma de pagamento</p>
              {Object.keys(relatorio.totaisPorFormaPagamento).length === 0 ? (
                <p className="text-sm text-ink-400">Sem vendas no período.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(relatorio.totaisPorFormaPagamento).map(([forma, total]) => (
                    <li key={forma} className="flex justify-between text-sm">
                      <span className="text-ink-300">{formatarFormaPagamento(forma)}</span>
                      <span className="font-mono text-ink-100">{formatarMoeda(total, tenant)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="mb-4 font-display text-base font-semibold text-ink-100">Produtos mais vendidos</p>
              {relatorio.produtosMaisVendidos.length === 0 ? (
                <p className="text-sm text-ink-400">Sem vendas no período.</p>
              ) : (
                <ul className="space-y-2">
                  {relatorio.produtosMaisVendidos.map((p) => (
                    <li key={p.productId} className="flex justify-between text-sm">
                      <span className="truncate text-ink-300">{p.nome}</span>
                      <span className="font-mono text-ink-100">{p.quantidadeVendida} un.</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ink-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-800 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Forma de pagamento</th>
                  <th className="px-5 py-3 font-medium text-right">Itens</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700 bg-ink-800/40">
                {relatorio.vendas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-ink-400">
                      Nenhuma venda no período selecionado.
                    </td>
                  </tr>
                ) : (
                  relatorio.vendas.map((venda) => (
                    <tr key={venda.id} className="transition-colors hover:bg-ink-800">
                      <td className="px-5 py-3.5 text-ink-300">{formatarDataHora(venda.timestamp, tenant)}</td>
                      <td className="px-5 py-3.5 text-ink-300">{venda.clienteNome ?? '—'}</td>
                      <td className="px-5 py-3.5 text-ink-300">{formatarFormaPagamento(venda.formaPagamento)}</td>
                      <td className="px-5 py-3.5 text-right text-ink-300">{venda.quantidadeItens}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-ink-100">
                        {formatarMoeda(venda.valorTotal, tenant)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
