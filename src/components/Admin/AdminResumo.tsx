import type { EmpresaAdmin } from '@/types';
import { formatarMoeda } from '@/utils/formatters';

export function emTrial(e: EmpresaAdmin): boolean {
  return Boolean(e.trialExpiraEm) && new Date(e.trialExpiraEm!).getTime() > Date.now();
}

/** Indicadores do topo do painel, calculados em cima da lista já carregada. */
export function AdminResumo({ empresas }: { empresas: EmpresaAdmin[] }) {
  const lojas = empresas.flatMap((e) => e.lojas);
  const usuarios = lojas.reduce((soma, l) => soma + l.usuarios.length, 0);
  const faturamento = lojas.reduce((soma, l) => soma + l.indicadores.faturamentoDoMes, 0);

  const cartoes = [
    { rotulo: 'Empresas', valor: String(empresas.length), detalhe: `${empresas.filter((e) => !e.ativo).length} suspensa(s)` },
    { rotulo: 'Lojas', valor: String(lojas.length), detalhe: `${lojas.filter((l) => !l.ativo).length} desativada(s)` },
    { rotulo: 'Usuários', valor: String(usuarios), detalhe: `${lojas.reduce((s, l) => s + l.usuarios.filter((u) => !u.ativo).length, 0)} inativo(s)` },
    { rotulo: 'Em teste grátis', valor: String(empresas.filter(emTrial).length), detalhe: `${empresas.filter((e) => e.trialExpiraEm && !emTrial(e)).length} expirado(s)` },
    { rotulo: 'Vendas no mês', valor: String(lojas.reduce((s, l) => s + l.indicadores.vendasDoMes, 0)), detalhe: 'somando todas as lojas' },
    { rotulo: 'Faturamento no mês', valor: formatarMoeda(faturamento, null), detalhe: 'vendido pelos clientes', destaque: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cartoes.map((c) => (
        <div key={c.rotulo} className="rounded-xl border border-ink-700 bg-ink-800 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{c.rotulo}</p>
          <p className={['mt-1.5 font-display text-2xl font-semibold', c.destaque ? 'text-tenant' : 'text-ink-100'].join(' ')}>{c.valor}</p>
          <p className="mt-0.5 text-xs text-ink-500">{c.detalhe}</p>
        </div>
      ))}
    </div>
  );
}
