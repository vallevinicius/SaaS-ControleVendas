import { NavLink } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

const itensDeNavegacao = [
  { rota: '/', rotulo: 'Dashboard', icone: '◧' },
  { rota: '/pdv', rotulo: 'Frente de Caixa', icone: '⛁' },
  { rota: '/estoque', rotulo: 'Estoque', icone: '▤' },
  { rota: '/financeiro', rotulo: 'Financeiro', icone: '◈' },
  { rota: '/clientes', rotulo: 'Clientes', icone: '◍' },
  { rota: '/relatorios', rotulo: 'Relatórios', icone: '▥' },
];

export function Sidebar() {
  const { tenant } = useTenant();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-700 bg-ink-800">
      <div className="border-b border-ink-700 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Total Control</p>
      </div>

      <div className="flex items-center gap-3 border-b border-ink-700 px-5 py-5">
        {tenant?.configuracoes.logoDaLojaUrl ? (
          <img
            src={tenant.configuracoes.logoDaLojaUrl}
            alt={`Logo de ${tenant.nomeFantasia}`}
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-ink-600"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-tenant" />
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-ink-100">
            {tenant?.nomeFantasia ?? 'Carregando…'}
          </p>
          <p className="truncate text-xs text-ink-400">Plano {tenant?.planoAtual ?? '—'}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {itensDeNavegacao.map((item) => (
          <NavLink
            key={item.rota}
            to={item.rota}
            end={item.rota === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-tenant-soft text-tenant' : 'text-ink-200 hover:bg-ink-700 hover:text-ink-100',
              ].join(' ')
            }
          >
            <span aria-hidden className="text-base leading-none">
              {item.icone}
            </span>
            {item.rotulo}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-700 px-5 py-4 text-xs text-ink-400">
        <p className="truncate">{tenant?.razaoSocial}</p>
        <p>{tenant?.cnpj}</p>
      </div>
    </aside>
  );
}
