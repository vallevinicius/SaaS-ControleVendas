import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/Common/ThemeToggle';
import { LogoMark } from '@/components/Common/LogoMark';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9 rounded-lg" />
          <span className="font-display text-base font-semibold tracking-tight text-ink-100">
            Total Control
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-300 md:flex">
          <a href="#recursos" className="transition-colors hover:text-ink-100">
            Recursos
          </a>
          <a href="#planos" className="transition-colors hover:text-ink-100">
            Planos
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden text-sm font-medium text-ink-200 hover:text-ink-100 sm:inline-block"
          >
            Entrar
          </Link>
          <Link
            to="/registrar"
            className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
