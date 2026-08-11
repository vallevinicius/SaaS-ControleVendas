import { useState } from 'react';
import type { Produto } from '@/types';

interface EntradaEstoqueModalProps {
  produto: Produto;
  aoFechar: () => void;
  aoConfirmar: (quantidade: number, precoCustoUnitario?: number) => Promise<void>;
}

export function EntradaEstoqueModal({ produto, aoFechar, aoConfirmar }: EntradaEstoqueModalProps) {
  const [quantidade, setQuantidade] = useState<number>(1);
  const [precoCusto, setPrecoCusto] = useState<number>(produto.precoCusto);
  const [enviando, setEnviando] = useState(false);

  async function handleConfirmar() {
    setEnviando(true);
    try {
      await aoConfirmar(quantidade, precoCusto);
      aoFechar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Dar entrada em mercadoria</p>
        <p className="mt-1 text-sm text-ink-400">{produto.nome}</p>

        <div className="mt-5 space-y-4">
          <label className="block text-sm text-ink-300">
            Quantidade recebida
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>

          <label className="block text-sm text-ink-300">
            Preço de custo unitário
            <input
              type="number"
              min={0}
              step={0.01}
              value={precoCusto}
              onChange={(e) => setPrecoCusto(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={aoFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={enviando || quantidade <= 0}
            className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enviando ? 'Registrando…' : 'Confirmar entrada'}
          </button>
        </div>
      </div>
    </div>
  );
}
