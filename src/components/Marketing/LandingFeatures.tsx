const recursos = [
  { icone: '⛁', titulo: 'PDV rápido', descricao: 'Venda no caixa com busca de produto instantânea e controle de turno.' },
  { icone: '▤', titulo: 'Controle de estoque', descricao: 'Entradas, saídas e alerta de estoque baixo em tempo real.' },
  { icone: '◈', titulo: 'Financeiro completo', descricao: 'Receitas, despesas e o saldo real da loja num só painel.' },
  { icone: '▥', titulo: 'Relatórios detalhados', descricao: 'Faturamento, ticket médio e os produtos que mais vendem.' },
  { icone: '◔', titulo: 'Vendedores e comissão', descricao: 'Apure a comissão de cada vendedor automaticamente.' },
  { icone: '◍', titulo: 'Cadastro de clientes', descricao: 'Histórico de compras vinculado a cada cliente da loja.' },
  { icone: '◑', titulo: 'Equipe com permissões', descricao: 'Cada login vê só as telas que você liberar.' },
  { icone: '▦', titulo: 'Múltiplas lojas', descricao: 'No plano Enterprise, controle todas as suas lojas com um único login.' },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="border-t border-ink-800 bg-ink-800/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink-100">
            Tudo que sua loja precisa, sem depender de planilha
          </h2>
          <p className="mt-3 text-ink-400">
            Um sistema só, pensado pro dia a dia de quem vende no balcão.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map((r) => (
            <div key={r.titulo} className="rounded-xl border border-ink-700 bg-ink-800 p-5">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenant-soft text-lg text-tenant"
              >
                {r.icone}
              </span>
              <p className="mt-4 font-display text-sm font-semibold text-ink-100">{r.titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{r.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
