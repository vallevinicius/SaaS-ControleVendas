import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Prévia das telas do sistema. São maquetes em CSS (dados de exemplo), então
 * não dependem de imagens e acompanham o tema claro/escuro. */

function Janela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-2xl shadow-black/10">
      <div className="flex items-center gap-1.5 border-b border-ink-700 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
        <span className="ml-3 text-xs font-medium text-ink-400">{titulo}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function MockPdv() {
  const produtos = [
    ['Refrigerante 2L', 'R$ 8,90'],
    ['Pão de forma', 'R$ 8,50'],
    ['Detergente', 'R$ 3,90'],
    ['Arroz 5kg', 'R$ 27,90'],
    ['Café 500g', 'R$ 16,50'],
    ['Leite integral', 'R$ 5,20'],
  ];
  return (
    <Janela titulo="PDV · Caixa aberto">
      <div className="grid gap-5 md:grid-cols-[1fr_260px]">
        <div>
          <div className="rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2 text-sm text-ink-500">Buscar produto ou código…</div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {produtos.map(([nome, preco]) => (
              <div key={nome} className="rounded-lg border border-ink-700 bg-ink-700/40 p-3">
                <p className="text-sm text-ink-200">{nome}</p>
                <p className="mt-1 font-mono text-sm text-tenant">{preco}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-ink-700/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Venda atual</p>
          <div className="mt-3 space-y-2 text-sm text-ink-200">
            <div className="flex justify-between"><span>2x Refrigerante 2L</span><span className="font-mono">17,80</span></div>
            <div className="flex justify-between"><span>1x Pão de forma</span><span className="font-mono">8,50</span></div>
            <div className="flex justify-between"><span>3x Detergente</span><span className="font-mono">11,70</span></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink-600 pt-3">
            <span className="text-sm text-ink-300">Total</span>
            <span className="font-display text-xl font-bold text-tenant">R$ 38,00</span>
          </div>
          <div className="mt-3 rounded-lg bg-tenant py-2 text-center text-sm font-semibold text-tenant-foreground">Finalizar venda</div>
        </div>
      </div>
    </Janela>
  );
}

function MockEstoque() {
  const linhas = [
    ['Refrigerante 2L', 'Bebidas', '48', 'ok'],
    ['Pão de forma', 'Padaria', '12', 'ok'],
    ['Detergente', 'Limpeza', '4', 'baixo'],
    ['Arroz 5kg', 'Mercearia', '31', 'ok'],
    ['Café 500g', 'Mercearia', '3', 'baixo'],
  ];
  return (
    <Janela titulo="Estoque · Produtos">
      <div className="overflow-hidden rounded-lg border border-ink-700">
        <div className="grid grid-cols-[1.6fr_1fr_0.6fr_0.8fr] bg-ink-700/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-400">
          <span>Produto</span><span>Categoria</span><span>Qtd.</span><span>Situação</span>
        </div>
        {linhas.map(([nome, cat, qtd, situacao]) => (
          <div key={nome} className="grid grid-cols-[1.6fr_1fr_0.6fr_0.8fr] items-center border-t border-ink-700 px-4 py-3 text-sm text-ink-200">
            <span>{nome}</span>
            <span className="text-ink-400">{cat}</span>
            <span className="font-mono">{qtd}</span>
            <span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  situacao === 'baixo' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500',
                ].join(' ')}
              >
                {situacao === 'baixo' ? 'Estoque baixo' : 'Em estoque'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Janela>
  );
}

function MockRelatorios() {
  const barras = [38, 52, 44, 68, 60, 82, 74];
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  return (
    <Janela titulo="Relatórios · Últimos 7 dias">
      <div className="grid grid-cols-3 gap-3">
        {[['Faturamento', 'R$ 8.420,00'], ['Vendas', '214'], ['Ticket médio', 'R$ 39,35']].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-lg border border-ink-700 bg-ink-700/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{rotulo}</p>
            <p className="mt-1 font-display text-base font-semibold text-ink-100 sm:text-lg">{valor}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-40 items-end gap-3 rounded-lg border border-ink-700 bg-ink-700/30 px-4 pb-3 pt-6">
        {barras.map((altura, i) => (
          <div key={dias[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="w-full rounded-t-md bg-tenant/80" style={{ height: `${altura}%` }} />
            <span className="text-[11px] text-ink-500">{dias[i]}</span>
          </div>
        ))}
      </div>
    </Janela>
  );
}

const ABAS = [
  { id: 'pdv', rotulo: 'PDV', titulo: 'Vendas rápidas no balcão', texto: 'Busque o produto, monte a venda e finalize em segundos, com controle de turno de caixa.', tela: <MockPdv /> },
  { id: 'estoque', rotulo: 'Estoque', titulo: 'Estoque sempre em dia', texto: 'Cada venda baixa o estoque sozinha, e os produtos acabando aparecem em destaque.', tela: <MockEstoque /> },
  { id: 'relatorios', rotulo: 'Relatórios', titulo: 'Números pra decidir melhor', texto: 'Faturamento, ticket médio e vendas por período, sem montar planilha.', tela: <MockRelatorios /> },
];

export function LandingShowcase() {
  const [ativa, setAtiva] = useState(ABAS[0].id);
  const aba = ABAS.find((a) => a.id === ativa) ?? ABAS[0];

  return (
    <section id="telas" className="border-t border-ink-800 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
            Por dentro do sistema
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-100">Veja como é no dia a dia</h2>
          <p className="mt-3 text-ink-400">Telas simples, feitas pra quem atende cliente o dia inteiro.</p>
        </div>

        <div role="tablist" aria-label="Telas do sistema" className="mx-auto mt-10 flex w-fit gap-1 rounded-xl border border-ink-700 bg-ink-800 p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={a.id === ativa}
              onClick={() => setAtiva(a.id)}
              className={[
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                a.id === ativa ? 'bg-tenant text-tenant-foreground shadow-sm' : 'text-ink-300 hover:text-ink-100',
              ].join(' ')}
            >
              {a.rotulo}
            </button>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-ink-400">
          <span className="font-semibold text-ink-100">{aba.titulo}.</span> {aba.texto}
        </p>

        <div className="relative mx-auto mt-8 max-w-4xl">
          <div className="absolute -inset-4 rounded-3xl bg-tenant/10 blur-2xl" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={aba.id}
              role="tabpanel"
              className="relative"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {aba.tela}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
