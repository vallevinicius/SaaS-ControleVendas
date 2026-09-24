const PASSOS = [
  {
    titulo: 'Crie sua conta',
    descricao: 'Cadastre sua loja em menos de um minuto, com 14 dias de teste grátis e sem cartão de crédito.',
  },
  {
    titulo: 'Cadastre produtos e equipe',
    descricao: 'Importe seus produtos por planilha ou cadastre um por um, e crie o login de cada funcionário.',
  },
  {
    titulo: 'Abra o caixa e venda',
    descricao: 'No PDV, com busca rápida de produto e atalhos de teclado pra vender sem perder tempo.',
  },
  {
    titulo: 'Acompanhe tudo em tempo real',
    descricao: 'Estoque, financeiro e relatórios de vendas, sempre atualizados, num painel só.',
  },
];

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-ink-800 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
            Como funciona
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-100">
            Da criação da conta à primeira venda
          </h2>
          <p className="mt-3 text-ink-400">Sem instalação, sem treinamento complicado.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((passo, indice) => (
            <div key={passo.titulo} className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tenant font-display text-sm font-bold text-tenant-foreground">
                {indice + 1}
              </span>
              <p className="mt-4 font-display text-sm font-semibold text-ink-100">{passo.titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{passo.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
