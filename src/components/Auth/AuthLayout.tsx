import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/Common/ThemeToggle';
import { LogoMark } from '@/components/Common/LogoMark';

interface AuthLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}

export function AuthLayout({ titulo, subtitulo, children, rodape }: AuthLayoutProps) {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-ink-900 px-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <LogoMark className="mb-2 h-11 w-11 rounded-xl" />
          <p className="font-display text-lg font-semibold tracking-tight text-ink-100">Total Control</p>
          <p className="text-xs text-ink-400">Gestão de vendas e estoque</p>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-800 p-6">
          <p className="font-display text-lg font-semibold text-ink-100">{titulo}</p>
          <p className="mt-1 text-sm text-ink-400">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>

        {rodape && <div className="mt-5 text-center text-sm text-ink-400">{rodape}</div>}
      </div>
    </div>
  );
}
