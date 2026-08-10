import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

/**
 * ConfirmContext
 * ----------------------------------------------------------------------------
 * Substitui window.confirm() (diálogo feio do navegador) por um modal com a
 * cara do app. `useConfirm()` devolve uma função async que resolve para
 * true/false, então o código que chama continua lendo como um confirm()
 * comum: `if (!(await confirmar({ ... }))) return;`
 * ----------------------------------------------------------------------------
 */

interface OpcoesConfirmacao {
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigoso?: boolean;
}

type ConfirmarFn = (opcoes: OpcoesConfirmacao) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmarFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<OpcoesConfirmacao | null>(null);
  const resolverRef = useRef<((valor: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmarFn>((novasOpcoes) => {
    setOpcoes(novasOpcoes);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function responder(valor: boolean) {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setOpcoes(null);
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {opcoes && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
            <p className="font-display text-lg font-semibold text-ink-100">{opcoes.titulo}</p>
            {opcoes.descricao && <p className="mt-2 text-sm text-ink-400">{opcoes.descricao}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => responder(false)}
                className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100"
              >
                {opcoes.textoCancelar ?? 'Cancelar'}
              </button>
              <button
                onClick={() => responder(true)}
                autoFocus
                className={[
                  'rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90',
                  opcoes.perigoso ? 'bg-red-600' : 'bg-tenant',
                ].join(' ')}
              >
                {opcoes.textoConfirmar ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmarFn {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm precisa ser usado dentro de um <ConfirmProvider>.');
  }
  return context;
}
