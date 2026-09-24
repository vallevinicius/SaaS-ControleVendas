import type { ComponentType, SVGProps } from 'react';
import {
  IconeCaixa,
  IconeCamadas,
  IconeCarrinho,
  IconeCarteira,
  IconeClientes,
  IconeComissao,
  IconeEscudo,
  IconeGrafico,
} from './iconesRecursos';

const recursos: { icone: ComponentType<SVGProps<SVGSVGElement>>; titulo: string; descricao: string }[] = [
  { icone: IconeCarrinho, titulo: 'PDV rápido', descricao: 'Venda no caixa com busca de produto instantânea e controle de turno.' },
  { icone: IconeCaixa, titulo: 'Controle de estoque', descricao: 'Entradas, saídas e alerta de estoque baixo em tempo real.' },
  { icone: IconeCarteira, titulo: 'Financeiro completo', descricao: 'Receitas, despesas e o saldo real da loja num só painel.' },
  { icone: IconeGrafico, titulo: 'Relatórios detalhados', descricao: 'Faturamento, ticket médio e os produtos que mais vendem.' },
  { icone: IconeComissao, titulo: 'Vendedores e comissão', descricao: 'Apure a comissão de cada vendedor automaticamente.' },
  { icone: IconeClientes, titulo: 'Cadastro de clientes', descricao: 'Histórico de compras vinculado a cada cliente da loja.' },
  { icone: IconeEscudo, titulo: 'Equipe com permissões', descricao: 'Cada login vê só as telas que você liberar.' },
  { icone: IconeCamadas, titulo: 'Múltiplas lojas', descricao: 'No plano Enterprise, controle todas as suas lojas com um único login.' },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="relative border-t border-ink-800 bg-ink-800/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
            Recursos
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-100">
            Tudo que sua loja precisa, sem depender de planilha
          </h2>
          <p className="mt-3 text-ink-400">
            Um sistema só, pensado pro dia a dia de quem vende no balcão.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recursos.map(({ icone: Icone, titulo, descricao }) => (
            <div
              key={titulo}
              className="group rounded-xl border border-ink-700 bg-ink-800 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-tenant/40 hover:shadow-lg hover:shadow-tenant/5"
            >
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenant-soft text-tenant transition-colors group-hover:bg-tenant group-hover:text-tenant-foreground"
              >
                <Icone className="h-5 w-5" />
              </span>
              <p className="mt-4 font-display text-sm font-semibold text-ink-100">{titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
