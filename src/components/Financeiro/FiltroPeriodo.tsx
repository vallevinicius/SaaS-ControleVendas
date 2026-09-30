import type { ReactNode } from 'react';

export function inicioDoMesAtual(): string {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FiltroPeriodoProps {
  inicio: string;
  fim: string;
  onInicio: (valor: string) => void;
  onFim: (valor: string) => void;
  onFiltrar: () => void;
  /** Botões extras alinhados à direita (ex: "+ Novo lançamento"). */
  children?: ReactNode;
}

const CAMPO_DATA =
  'mt-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none';

/** Filtro de período compartilhado pelas telas do Financeiro. */
export function FiltroPeriodo({ inicio, fim, onInicio, onFim, onFiltrar, children }: FiltroPeriodoProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4">
      <label className="block text-sm text-ink-300">
        De
        <input type="date" value={inicio} onChange={(e) => onInicio(e.target.value)} className={CAMPO_DATA} />
      </label>
      <label className="block text-sm text-ink-300">
        Até
        <input type="date" value={fim} onChange={(e) => onFim(e.target.value)} className={CAMPO_DATA} />
      </label>
      <button onClick={onFiltrar} className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90">
        Filtrar
      </button>
      {children && <div className="ml-auto flex gap-3">{children}</div>}
    </div>
  );
}
