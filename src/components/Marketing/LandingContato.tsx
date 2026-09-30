import { linkWhatsapp } from '@/utils/contato';

export function LandingContato() {
  return (
    <section id="contato" className="py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-tenant/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-md">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink-100">Prefere conversar antes?</h2>
              <p className="mt-2 text-ink-400">
                Tire dúvidas, peça uma demonstração ou fale sobre o plano Enterprise direto com a equipe da Total Software.
              </p>
            </div>
            <a
              href={linkWhatsapp('Olá! Gostaria de conversar sobre o Total Control.')}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-tenant px-6 py-3 text-sm font-semibold text-tenant-foreground shadow-lg shadow-tenant/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
