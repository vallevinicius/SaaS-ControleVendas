import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/**
 * ToastContext
 * ----------------------------------------------------------------------------
 * Substitui alert()/mensagens inline por notificações discretas, empilhadas
 * no canto da tela, que somem sozinhas. Use `useToast()` em qualquer
 * componente: `toast.sucesso('Venda finalizada.')` / `toast.erro('...')`.
 * ----------------------------------------------------------------------------
 */

type TipoToast = 'sucesso' | 'erro' | 'info';

interface Toast {
  id: number;
  tipo: TipoToast;
  texto: string;
}

interface ToastContextValue {
  sucesso: (texto: string) => void;
  erro: (texto: string) => void;
  info: (texto: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURACAO_MS = 4500;

const estilosPorTipo: Record<TipoToast, string> = {
  sucesso: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  erro: 'border-red-500/30 bg-red-500/15 text-red-300',
  info: 'border-ink-600 bg-ink-800 text-ink-200',
};

const iconesPorTipo: Record<TipoToast, string> = {
  sucesso: '✓',
  erro: '✕',
  info: 'i',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remover = useCallback((id: number) => {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }, []);

  const empilhar = useCallback(
    (tipo: TipoToast, texto: string) => {
      const id = Date.now() + Math.random();
      setToasts((atual) => [...atual, { id, tipo, texto }]);
      setTimeout(() => remover(id), DURACAO_MS);
    },
    [remover],
  );

  const value: ToastContextValue = {
    sucesso: (texto) => empilhar('sucesso', texto),
    erro: (texto) => empilhar('erro', texto),
    info: (texto) => empilhar('info', texto),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur animate-[toast-in_0.2s_ease-out]',
              estilosPorTipo[t.tipo],
            ].join(' ')}
          >
            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[10px] font-bold">
              {iconesPorTipo[t.tipo]}
            </span>
            <p className="flex-1">{t.texto}</p>
            <button
              onClick={() => remover(t.id)}
              className="text-xs opacity-60 transition-opacity hover:opacity-100"
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast precisa ser usado dentro de um <ToastProvider>.');
  }
  return context;
}
