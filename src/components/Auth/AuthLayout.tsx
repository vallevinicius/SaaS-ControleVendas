import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/Common/ThemeToggle';
import { LogoMark } from '@/components/Common/LogoMark';
import { IconeSuporte } from './icones';

interface AuthLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}

export function AuthLayout({ titulo, subtitulo, children, rodape }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-ink-900 px-4 py-10">
      {/* Glow decorativo, mesmo efeito usado no hero da landing page. */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-tenant/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-tenant/10 blur-3xl"
        aria-hidden
      />

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-xl shadow-black/5">
          <div className="flex items-center justify-center gap-2.5 bg-tenant px-6 py-5">
            <LogoMark className="h-9 w-9 rounded-lg" />
            <span className="font-display text-lg font-semibold text-tenant-foreground">Total Control</span>
          </div>

          <div className="p-7">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-tenant">
              Gestão de vendas e estoque
            </p>
            <p className="mt-2 text-center font-display text-xl font-semibold text-ink-100">{titulo}</p>
            <p className="mt-1 text-center text-sm text-ink-400">{subtitulo}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-ink-700 px-6 py-4 text-xs text-ink-500">
            <IconeSuporte className="h-4 w-4 shrink-0" />
            Problemas de acesso? Fale com o suporte.
          </div>
        </div>

        {rodape && <div className="mt-6 text-center text-sm text-ink-400">{rodape}</div>}
      </div>
    </div>
  );
}
