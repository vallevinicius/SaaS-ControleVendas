import { useState, type FormEvent, type ReactNode } from 'react';

function Fundo({ children, onFechar }: { children: ReactNode; onFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      {children}
    </div>
  );
}

interface ExcluirProps {
  titulo: string;
  descricao: string;
  /** Texto que a pessoa precisa digitar pra liberar o botão. */
  confirmacao: string;
  onCancelar: () => void;
  onConfirmar: () => Promise<void>;
}

/** Confirmação de exclusão definitiva: só libera o botão depois de digitar o
 * nome (ou CNPJ) do que será apagado, pra ninguém excluir por engano. */
export function ModalExcluir({ titulo, descricao, confirmacao, onCancelar, onConfirmar }: ExcluirProps) {
  const [digitado, setDigitado] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (digitado !== confirmacao) return;
    setExcluindo(true);
    try {
      await onConfirmar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <Fundo onFechar={onCancelar}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">{titulo}</p>
        <p className="mt-2 text-sm text-ink-400">{descricao}</p>
        <p className="mt-4 text-sm text-ink-300">
          Digite <span className="font-mono text-ink-100">{confirmacao}</span> para confirmar:
        </p>
        <input
          autoFocus
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-sm text-ink-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={excluindo || digitado !== confirmacao}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {excluindo ? 'Excluindo…' : 'Excluir para sempre'}
          </button>
        </div>
      </form>
    </Fundo>
  );
}

export function ModalSenhaGerada({ usuarioNome, senha, onFechar }: { usuarioNome: string; senha: string; onFechar: () => void }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
    } catch {
      // Sem permissão de área de transferência: a senha continua selecionável na tela.
    }
  }

  return (
    <Fundo onFechar={onFechar}>
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Senha redefinida</p>
        <p className="mt-2 text-sm text-ink-400">
          Nova senha temporária de {usuarioNome}. Copie e repasse com segurança: ela não será mostrada de novo.
        </p>
        <p className="mt-4 select-all rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-center font-mono text-sm text-ink-100">
          {senha}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={copiar}
            className="flex-1 rounded-lg border border-ink-600 py-2.5 text-sm font-medium text-ink-200 hover:border-ink-500 hover:text-ink-100"
          >
            {copiada ? 'Copiada ✓' : 'Copiar'}
          </button>
          <button onClick={onFechar} className="flex-1 rounded-lg bg-tenant py-2.5 text-sm font-semibold text-tenant-foreground hover:opacity-90">
            Fechar
          </button>
        </div>
      </div>
    </Fundo>
  );
}

export { Fundo as ModalFundo };
