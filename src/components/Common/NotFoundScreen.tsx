import { Link } from 'react-router-dom';
import { LogoMark } from './LogoMark';

/** Página 404 — qualquer rota desconhecida caía silenciosamente em "/" antes
 * disso existir, o que confundia quem digitava um link errado. */
export function NotFoundScreen() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-ink-900 px-4 text-center">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-tenant/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-tenant/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <LogoMark className="mx-auto h-14 w-14 rounded-2xl shadow-lg shadow-black/10 ring-1 ring-ink-700/60" />
        <p className="mt-6 font-display text-6xl font-bold tracking-tight text-tenant">404</p>
        <p className="mt-2 font-display text-xl font-semibold text-ink-100">Página não encontrada</p>
        <p className="mt-2 max-w-sm text-sm text-ink-400">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-tenant px-6 py-3 text-sm font-semibold text-tenant-foreground shadow-lg shadow-tenant/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
