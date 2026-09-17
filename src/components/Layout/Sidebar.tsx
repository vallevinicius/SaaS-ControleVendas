import { useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { TELAS_COM_PERMISSAO, podeVerTela } from '@/utils/permissoes';
import { diasRestantesTrial, planoPermiteMultiLoja, planoPermiteTela } from '@/utils/planos';
import { mascararCnpj } from '@/utils/mascaras';
import { criarLoja, atualizarAparencia } from '@/services/apiService';

const icones: Record<string, string> = {
  dashboard: '◧',
  pdv: '⛁',
  estoque: '▤',
  financeiro: '◈',
  clientes: '◍',
  vendedores: '◔',
  relatorios: '▥',
};

const itemUsuarios = { rota: '/usuarios', rotulo: 'Usuários', icone: '◑' };
const itemPlano = { rota: '/plano', rotulo: 'Meu plano', icone: '◈' };
const itemAuditoria = { rota: '/auditoria', rotulo: 'Auditoria', icone: '▥' };

interface SidebarProps {
  aberta: boolean;
  aoFechar: () => void;
}

export function Sidebar({ aberta, aoFechar }: SidebarProps) {
  const { tenant, usuarioAtual, lojas, trocarLoja, recarregarSessao } = useTenant();
  const toast = useToast();
  const [mostrarNovaLoja, setMostrarNovaLoja] = useState(false);
  const [nomeFantasiaLoja, setNomeFantasiaLoja] = useState('');
  const [cnpjLoja, setCnpjLoja] = useState('');
  const [criandoLoja, setCriandoLoja] = useState(false);
  const [mostrarAparencia, setMostrarAparencia] = useState(false);
  const [corEscolhida, setCorEscolhida] = useState(tenant?.configuracoes.corPrincipalDoTema ?? '#10B981');
  const [salvandoAparencia, setSalvandoAparencia] = useState(false);

  const plano = tenant?.planoAtual;
  const itens = TELAS_COM_PERMISSAO.filter((tela) => podeVerTela(usuarioAtual, tela.chave)).map((tela) => ({
    rota: tela.rota,
    rotulo: tela.rotulo,
    icone: icones[tela.chave],
    bloqueadoPeloPlano: plano ? !planoPermiteTela(plano, tela.chave) : false,
  }));
  if (usuarioAtual?.papel === 'ADMIN') {
    itens.push({ ...itemUsuarios, bloqueadoPeloPlano: false });
    itens.push({ ...itemPlano, bloqueadoPeloPlano: false });
  }
  if (usuarioAtual?.raiz) itens.push({ ...itemAuditoria, bloqueadoPeloPlano: false });

  const diasTrial = diasRestantesTrial(tenant?.trialExpiraEm);
  const podeCriarLoja = Boolean(usuarioAtual?.raiz && plano && planoPermiteMultiLoja(plano));

  async function handleTrocarLoja(tenantId: string) {
    if (tenantId === tenant?.id) return;
    try {
      await trocarLoja(tenantId);
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao trocar de loja.');
    }
  }

  async function handleCriarLoja(e: FormEvent) {
    e.preventDefault();
    setCriandoLoja(true);
    try {
      await criarLoja({ nomeFantasia: nomeFantasiaLoja.trim(), cnpj: cnpjLoja.trim() });
      toast.sucesso(`Loja "${nomeFantasiaLoja.trim()}" criada.`);
      setNomeFantasiaLoja('');
      setCnpjLoja('');
      setMostrarNovaLoja(false);
      await recarregarSessao();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao criar loja.');
    } finally {
      setCriandoLoja(false);
    }
  }

  async function handleSalvarAparencia() {
    setSalvandoAparencia(true);
    try {
      await atualizarAparencia({ corPrincipalDoTema: corEscolhida });
      toast.sucesso('Cor da loja atualizada.');
      setMostrarAparencia(false);
      await recarregarSessao();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao salvar a cor.');
    } finally {
      setSalvandoAparencia(false);
    }
  }

  return (
    <>
      {aberta && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={aoFechar} aria-hidden />
      )}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-ink-700 bg-ink-800 transition-transform duration-200',
          aberta ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Total Control</p>
          <button onClick={aoFechar} aria-label="Fechar menu" className="text-ink-400 hover:text-ink-100 md:hidden">
            ✕
          </button>
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
          <div className="min-w-0 flex-1">
            {lojas.length > 1 ? (
              <select
                value={tenant?.id ?? ''}
                onChange={(e) => handleTrocarLoja(e.target.value)}
                className="w-full truncate rounded-md border border-ink-700 bg-ink-800 font-display text-sm font-semibold text-ink-100 focus:border-tenant focus:outline-none"
              >
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nomeFantasia}
                  </option>
                ))}
              </select>
            ) : (
              <p className="truncate font-display text-sm font-semibold text-ink-100">
                {tenant?.nomeFantasia ?? 'Carregando…'}
              </p>
            )}
            <p className="truncate text-xs text-ink-400">Plano {tenant?.planoAtual ?? '—'}</p>
            {diasTrial !== null && (
              <p className={['truncate text-xs', diasTrial <= 3 ? 'text-amber-400' : 'text-ink-500'].join(' ')}>
                Teste grátis: {diasTrial > 0 ? `faltam ${diasTrial} dia(s)` : 'expirado'}
              </p>
            )}
          </div>
          {usuarioAtual?.raiz && (
            <button
              onClick={() => {
                setCorEscolhida(tenant?.configuracoes.corPrincipalDoTema ?? '#10B981');
                setMostrarAparencia(true);
              }}
              title="Personalizar cor da loja"
              aria-label="Personalizar cor da loja"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-ink-700 hover:text-ink-100"
            >
              ⚙
            </button>
          )}
        </div>

        {podeCriarLoja && (
          <button
            onClick={() => setMostrarNovaLoja(true)}
            className="mx-3 mt-3 rounded-lg border border-dashed border-ink-600 px-3 py-2 text-left text-xs font-medium text-ink-300 hover:border-tenant hover:text-tenant"
          >
            + Nova loja
          </button>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {itens.map((item) =>
            item.bloqueadoPeloPlano ? (
              <div
                key={item.rota}
                title={`Disponível em planos superiores ao ${plano}`}
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 opacity-60"
              >
                <span aria-hidden className="text-base leading-none">
                  {item.icone}
                </span>
                {item.rotulo}
                <span aria-hidden className="ml-auto text-xs">
                  🔒
                </span>
              </div>
            ) : (
              <NavLink
                key={item.rota}
                to={item.rota}
                end={item.rota === '/'}
                onClick={aoFechar}
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
            ),
          )}
        </nav>

        <div className="border-t border-ink-700 px-5 py-4 text-xs text-ink-400">
          <p className="truncate">{tenant?.razaoSocial}</p>
          <p>{tenant?.cnpj}</p>
        </div>

        {mostrarNovaLoja && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="font-display text-lg font-semibold text-ink-100">Nova loja</p>
              <p className="mt-1 text-sm text-ink-400">
                Cria mais uma loja pra sua empresa, com dados totalmente separados. Você continua acessando as duas
                com o mesmo login.
              </p>

              <form onSubmit={handleCriarLoja} className="mt-4 space-y-3">
                <label className="block text-sm text-ink-300">
                  Nome fantasia
                  <input
                    required
                    autoFocus
                    value={nomeFantasiaLoja}
                    onChange={(e) => setNomeFantasiaLoja(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
                  />
                </label>
                <label className="block text-sm text-ink-300">
                  CNPJ
                  <input
                    required
                    inputMode="numeric"
                    value={cnpjLoja}
                    onChange={(e) => setCnpjLoja(mascararCnpj(e.target.value))}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 placeholder:text-ink-400 focus:border-tenant focus:outline-none"
                  />
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarNovaLoja(false)}
                    className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={criandoLoja}
                    className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {criandoLoja ? 'Criando…' : 'Criar loja'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {mostrarAparencia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
              <p className="font-display text-lg font-semibold text-ink-100">Aparência da loja</p>
              <p className="mt-1 text-sm text-ink-400">
                Escolha a cor de destaque usada nos botões e links dessa loja.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="color"
                  value={corEscolhida}
                  onChange={(e) => setCorEscolhida(e.target.value)}
                  className="h-11 w-11 cursor-pointer rounded-lg border border-ink-600 bg-transparent"
                />
                <input
                  value={corEscolhida}
                  onChange={(e) => setCorEscolhida(e.target.value)}
                  placeholder="#10B981"
                  className="flex-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 font-mono text-sm text-ink-100 focus:border-tenant focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarAparencia(false)}
                  className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarAparencia}
                  disabled={salvandoAparencia}
                  className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {salvandoAparencia ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
