import { Link } from 'react-router-dom';

/** Faixa de call-to-action final, antes do rodapé — reforça o mesmo convite
 * do hero (teste grátis) num ponto onde quem rolou a página até o fim já
 * viu recursos e planos e está mais perto de decidir. */
export function LandingCTA() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-tenant to-tenant-hover" aria-hidden />
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          Pronto pra tirar sua loja da planilha?
        </h2>
        <p className="mt-3 text-tenant-foreground/90">
          Comece seu teste grátis de 14 dias, sem cartão de crédito.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/registrar"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-tenant shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5"
          >
            Começar agora
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  );
}
