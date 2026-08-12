import { useState, type FormEvent } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { formatarMoeda } from '@/utils/formatters';
import type { Caixa } from '@/types';

const SEM_SPINNER_NATIVO =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

interface AbrirCaixaCardProps {
  historico: Caixa[];
  carregandoHistorico: boolean;
  aoAbrir: (valorAbertura: number) => Promise<void>;
}

export function AbrirCaixaCard({ historico, carregandoHistorico, aoAbrir }: AbrirCaixaCardProps) {
  const { tenant } = useTenant();
  const [valorAbertura, setValorAbertura] = useState<number>(0);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await aoAbrir(valorAbertura);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col justify-center gap-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-ink-700 bg-ink-800 p-8 text-center">
        <p className="font-display text-lg font-semibold text-ink-100">O caixa está fechado</p>
        <p className="mt-1 text-sm text-ink-400">Informe o valor inicial em dinheiro pra abrir o caixa e começar a vender.</p>

        <label className="mx-auto mt-6 block max-w-[200px] text-sm text-ink-300">
          Valor de abertura
          <div className="mt-1 flex items-center rounded-lg border border-ink-600 bg-ink-700 px-3 py-2">
            <span className="text-ink-400">R$</span>
            <input
              autoFocus
              type="number"
              min={0}
              step={0.01}
              value={valorAbertura === 0 ? '' : valorAbertura}
              onChange={(e) => setValorAbertura(Number(e.target.value) || 0)}
              className={['ml-2 w-full bg-transparent text-right font-mono text-ink-100 outline-none', SEM_SPINNER_NATIVO].join(' ')}
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="mt-6 w-full rounded-xl bg-tenant py-3 text-sm font-semibold text-tenant-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Abrindo…' : 'Abrir caixa'}
        </button>
      </form>

      {!carregandoHistorico && historico.length > 0 && (
        <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">Últimos caixas</p>
          <ul className="divide-y divide-ink-700">
            {historico.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink-200">
                    {new Date(c.abertoEm).toLocaleDateString('pt-BR')} · {c.abertoPorNome}
                  </p>
                  <p className="text-xs text-ink-500">
                    {c.status === 'ABERTO' ? 'Em aberto' : `Fechado ${c.fechadoEm ? new Date(c.fechadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-ink-100">{formatarMoeda(c.resumo.totalVendido, tenant)}</p>
                  <p className="text-xs text-ink-500">{c.resumo.quantidadeVendas} venda(s)</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
