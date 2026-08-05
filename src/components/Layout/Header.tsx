import { useTenant } from '@/contexts/TenantContext';

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
}

export function Header({ titulo, subtitulo }: HeaderProps) {
  const { usuarioAtual, logout } = useTenant();

  return (
    <header className="flex items-center justify-between border-b border-ink-700 bg-ink-800/60 px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-100">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-ink-400">{subtitulo}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-full bg-ink-700 py-1.5 pl-1.5 pr-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-tenant text-xs font-semibold text-white">
            {usuarioAtual?.nome.charAt(0) ?? '?'}
          </div>
          <div className="text-xs">
            <p className="font-medium text-ink-100">{usuarioAtual?.nome ?? 'Convidado'}</p>
            <p className="text-ink-400">{usuarioAtual?.papel}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-ink-600 px-3 py-2 text-xs font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
