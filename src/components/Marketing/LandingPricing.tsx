import { Link } from 'react-router-dom';
import { LIMITES_POR_PLANO } from '@/utils/planos';
import { linkWhatsapp } from '@/utils/contato';
import type { PlanoSaaS } from '@/types';

interface CartaoPlano {
  plano: PlanoSaaS;
  rotulo: string;
  preco: string;
  detalhePreco: string;
  destaque?: boolean;
}

// FREE não aparece aqui — hoje é só uma opção residual atribuível pelo
// admin da plataforma, não um plano público (o trial roda no Starter).
const PLANOS: CartaoPlano[] = [
  { plano: 'STARTER', rotulo: 'Starter', preco: 'R$ 59,90', detalhePreco: '/mês' },
  { plano: 'PRO', rotulo: 'Pro', preco: 'R$ 129,90', detalhePreco: '/mês', destaque: true },
  {
    plano: 'ENTERPRISE',
    rotulo: 'Enterprise',
    preco: 'A partir de R$ 249,90',
    detalhePreco: '/mês + R$ 79,90 por loja adicional',
  },
];

function listaRecursos(plano: PlanoSaaS): string[] {
  const { maxUsuarios, maxProdutos, features } = LIMITES_POR_PLANO[plano];
  const itens = [
    maxUsuarios ? `${maxUsuarios} usuário(s)` : 'Usuários ilimitados',
    maxProdutos ? `${maxProdutos} produtos` : 'Produtos ilimitados',
  ];
  if (features.financeiro) itens.push('Financeiro');
  if (features.relatorios) itens.push('Relatórios');
  if (features.vendedores) itens.push('Vendedores e comissão');
  if (features.multiLoja) itens.push('Múltiplas lojas');
  return itens;
}

export function LandingPricing() {
  return (
    <section id="planos" className="relative py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
            Planos
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-100">
            Planos pra cada tamanho de loja
          </h2>
          <p className="mt-3 text-ink-400">Comece grátis por 14 dias | sem cartão de crédito.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-start">
          {PLANOS.map(({ plano, rotulo, preco, detalhePreco, destaque }) => (
            <div
              key={plano}
              className={[
                'relative flex flex-col rounded-2xl border p-6 transition-transform duration-200',
                destaque
                  ? 'border-tenant bg-ink-800 shadow-2xl shadow-tenant/10 md:-translate-y-3 md:scale-[1.03]'
                  : 'border-ink-700 bg-ink-800 hover:-translate-y-1 hover:border-ink-600',
              ].join(' ')}
            >
              {destaque && (
                <div
                  className="pointer-events-none absolute inset-x-6 -top-3 h-3 rounded-full bg-tenant/30 blur-md"
                  aria-hidden
                />
              )}
              {destaque && (
                <span className="relative mb-3 w-fit rounded-full bg-tenant px-2.5 py-0.5 text-xs font-semibold text-tenant-foreground">
                  Mais popular
                </span>
              )}
              <p className="font-display text-lg font-semibold text-ink-100">{rotulo}</p>
              <p className="mt-3">
                <span className="font-display text-3xl font-bold text-ink-100">{preco}</span>
                <span className="ml-1 text-sm text-ink-400">{detalhePreco}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-ink-300">
                {listaRecursos(plano).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-tenant-soft text-[10px] text-tenant"
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/registrar"
                className={[
                  'mt-6 rounded-lg py-2.5 text-center text-sm font-semibold transition-all',
                  destaque
                    ? 'bg-tenant text-tenant-foreground shadow-md shadow-tenant/20 hover:opacity-90'
                    : 'border border-ink-600 text-ink-200 hover:border-ink-500 hover:text-ink-100',
                ].join(' ')}
              >
                Começar teste grátis
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-500">
          Precisa de mais de uma loja e ainda não é Enterprise?{' '}
          <a
            href={linkWhatsapp('Olá! Quero saber mais sobre o plano Enterprise do Total Control.')}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-tenant hover:underline"
          >
            Fale com a gente no WhatsApp
          </a>
          .
        </p>
      </div>
    </section>
  );
}
