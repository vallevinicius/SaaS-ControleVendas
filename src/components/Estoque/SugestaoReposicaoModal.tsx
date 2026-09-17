import { useEffect, useState } from 'react';
import { LoadingState } from '@/components/Common/LoadingState';
import { getSugestaoReposicao } from '@/services/apiService';
import type { SugestaoReposicao } from '@/types';

interface SugestaoReposicaoModalProps {
  aoFechar: () => void;
  aoRegistrarEntrada: (produtoId: string, quantidade: number) => void;
}

export function SugestaoReposicaoModal({ aoFechar, aoRegistrarEntrada }: SugestaoReposicaoModalProps) {
  const [sugestoes, setSugestoes] = useState<SugestaoReposicao[] | null>(null);

  useEffect(() => {
    getSugestaoReposicao().then(setSugestoes);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Sugestão de reposição</p>
        <p className="mt-1 text-sm text-ink-400">
          Produtos no estoque mínimo ou abaixo, com uma sugestão baseada no ritmo de venda dos últimos 30 dias.
        </p>

        {!sugestoes ? (
          <LoadingState mensagem="Calculando…" />
        ) : sugestoes.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">Nenhum produto precisando de reposição agora.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {sugestoes.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-ink-700 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{s.nome}</p>
                  <p className="text-xs text-ink-500">
                    {s.quantidadeEmEstoque} em estoque · mínimo {s.estoqueMinimo} · vendeu {s.vendidoUltimos30Dias} nos últimos
                    30 dias
                  </p>
                </div>
                <button
                  onClick={() => aoRegistrarEntrada(s.id, s.quantidadeSugerida)}
                  className="ml-3 shrink-0 rounded-lg bg-tenant px-3 py-1.5 text-xs font-semibold text-tenant-foreground hover:opacity-90"
                >
                  Repor {s.quantidadeSugerida}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={aoFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
