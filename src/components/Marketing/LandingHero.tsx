import { Link } from 'react-router-dom';

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
          PDV · Estoque · Financeiro
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-ink-100 md:text-5xl">
          O controle da sua loja, do caixa ao estoque, em um só lugar
        </h1>
        <p className="mt-5 max-w-lg text-lg text-ink-400">
          O Total Control é o sistema de ponto de venda feito pro pequeno varejo brasileiro:
          venda no PDV, controle o estoque, acompanhe o financeiro e gerencie sua equipe — sem
          complicação.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/registrar"
            className="rounded-lg bg-tenant px-6 py-3 text-sm font-semibold text-tenant-foreground hover:opacity-90"
          >
            Começar teste grátis
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-ink-600 px-6 py-3 text-sm font-semibold text-ink-200 hover:border-ink-500 hover:text-ink-100"
          >
            Já tenho conta
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-500">14 dias grátis · sem cartão de crédito</p>
      </div>

      {/* "Mockup" da tela de PDV só em CSS, sem depender de nenhuma imagem. */}
      <div className="relative">
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-tenant/10 blur-2xl" aria-hidden />
        <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-ink-700 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            <span className="ml-3 text-xs font-medium text-ink-400">Caixa · Turno aberto</span>
          </div>
          <div className="space-y-2.5 p-5">
            {[
              { nome: 'Refrigerante 2L', qtd: 2, valor: 'R$ 17,80' },
              { nome: 'Pão de forma', qtd: 1, valor: 'R$ 8,50' },
              { nome: 'Detergente', qtd: 3, valor: 'R$ 11,70' },
            ].map((item) => (
              <div
                key={item.nome}
                className="flex items-center justify-between rounded-lg bg-ink-700/60 px-3.5 py-2.5 text-sm"
              >
                <span className="text-ink-200">
                  {item.qtd}x {item.nome}
                </span>
                <span className="font-mono text-ink-100">{item.valor}</span>
              </div>
            ))}
            <div className="!mt-4 flex items-center justify-between border-t border-ink-700 pt-4">
              <span className="text-sm font-medium text-ink-300">Total</span>
              <span className="font-display text-xl font-bold text-tenant">R$ 38,00</span>
            </div>
            <button className="w-full rounded-lg bg-tenant py-2.5 text-sm font-semibold text-tenant-foreground">
              Finalizar venda
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
