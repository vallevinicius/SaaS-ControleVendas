import { useEffect, useState, type FormEvent } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
  adminListTenants,
  adminSetPlano,
  adminSetUsuarioAtivo,
  adminResetarSenha,
  adminCreateTenant,
  adminSetTenantAtivo,
  adminDeleteTenant,
} from '@/services/adminApiService';
import { mascararCnpj, mascararTelefone } from '@/utils/mascaras';
import type { PlanoSaaS, TenantAdmin } from '@/types';

const planos: PlanoSaaS[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const rotulosPapel: Record<string, string> = {
  ADMIN: 'Admin',
  GERENTE: 'Gerente',
  OPERADOR_CAIXA: 'Operador de caixa',
};

export function AdminDashboard() {
  const { logout } = useAdminAuth();
  const toast = useToast();
  const confirmar = useConfirm();

  const [tenants, setTenants] = useState<TenantAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tenantExpandido, setTenantExpandido] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ usuarioNome: string; senha: string } | null>(null);

  const [mostrarNovaLoja, setMostrarNovaLoja] = useState(false);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [planoNovo, setPlanoNovo] = useState<PlanoSaaS>('FREE');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [criandoLoja, setCriandoLoja] = useState(false);

  const [lojaParaExcluir, setLojaParaExcluir] = useState<TenantAdmin | null>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      setTenants(await adminListTenants());
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao carregar lojas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrocarPlano(tenantId: string, planoAtual: PlanoSaaS) {
    try {
      await adminSetPlano(tenantId, planoAtual);
      await carregar();
      toast.sucesso(`Plano alterado para ${planoAtual}.`);
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao trocar plano.');
    }
  }

  async function handleToggleAtivo(usuarioId: string, ativo: boolean) {
    try {
      await adminSetUsuarioAtivo(usuarioId, ativo);
      await carregar();
      toast.sucesso(ativo ? 'Usuário ativado.' : 'Usuário desativado.');
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao atualizar usuário.');
    }
  }

  async function handleResetarSenha(usuarioId: string, usuarioNome: string) {
    try {
      const senha = await adminResetarSenha(usuarioId);
      setSenhaGerada({ usuarioNome, senha });
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao resetar senha.');
    }
  }

  async function handleCriarLoja(e: FormEvent) {
    e.preventDefault();
    setCriandoLoja(true);
    try {
      await adminCreateTenant({
        nomeFantasia: nomeFantasia.trim(),
        razaoSocial: razaoSocial.trim() || undefined,
        cnpj: cnpj.trim(),
        telefone: telefone.trim() || undefined,
        email: emailContato.trim() || undefined,
        planoAtual: planoNovo,
        nomeAdmin: nomeAdmin.trim(),
        emailAdmin: emailAdmin.trim(),
        senhaAdmin,
      });
      toast.sucesso(`Loja "${nomeFantasia.trim()}" criada.`);
      setNomeFantasia('');
      setRazaoSocial('');
      setCnpj('');
      setTelefone('');
      setEmailContato('');
      setPlanoNovo('FREE');
      setNomeAdmin('');
      setEmailAdmin('');
      setSenhaAdmin('');
      setMostrarNovaLoja(false);
      await carregar();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao criar loja.');
    } finally {
      setCriandoLoja(false);
    }
  }

  async function handleToggleTenantAtivo(tenant: TenantAdmin) {
    const confirmou = await confirmar({
      titulo: tenant.ativo ? `Suspender "${tenant.nomeFantasia}"?` : `Reativar "${tenant.nomeFantasia}"?`,
      descricao: tenant.ativo
        ? 'Nenhum usuário dessa loja vai conseguir logar enquanto estiver suspensa.'
        : undefined,
      textoConfirmar: tenant.ativo ? 'Suspender' : 'Reativar',
      perigoso: tenant.ativo,
    });
    if (!confirmou) return;

    try {
      await adminSetTenantAtivo(tenant.id, !tenant.ativo);
      await carregar();
      toast.sucesso(tenant.ativo ? 'Loja suspensa.' : 'Loja reativada.');
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao atualizar loja.');
    }
  }

  async function handleExcluirLoja() {
    if (!lojaParaExcluir || confirmacaoExclusao !== lojaParaExcluir.nomeFantasia) return;
    setExcluindo(true);
    try {
      await adminDeleteTenant(lojaParaExcluir.id);
      toast.sucesso(`Loja "${lojaParaExcluir.nomeFantasia}" excluída.`);
      setLojaParaExcluir(null);
      setConfirmacaoExclusao('');
      await carregar();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao excluir loja.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-8 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Total Software</p>
          <h1 className="font-display text-xl font-semibold text-zinc-100">Painel interno</h1>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
        >
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-400">{tenants.length} loja(s) cadastrada(s) na plataforma.</p>
          <button
            onClick={() => setMostrarNovaLoja((atual) => !atual)}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            {mostrarNovaLoja ? 'Cancelar' : '+ Nova loja'}
          </button>
        </div>

        {mostrarNovaLoja && (
          <form
            onSubmit={handleCriarLoja}
            className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <p className="col-span-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Dados da loja</p>
            <label className="block text-sm text-zinc-400">
              Nome fantasia
              <input
                required
                autoFocus
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Razão social (opcional)
              <input
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              CNPJ
              <input
                required
                inputMode="numeric"
                value={cnpj}
                onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
                placeholder="00.000.000/0001-00"
                maxLength={18}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Plano
              <select
                value={planoNovo}
                onChange={(e) => setPlanoNovo(e.target.value as PlanoSaaS)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              >
                {planos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-zinc-400">
              Telefone de contato
              <input
                inputMode="numeric"
                value={telefone}
                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              E-mail de contato
              <input
                type="email"
                value={emailContato}
                onChange={(e) => setEmailContato(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <p className="col-span-2 mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Admin principal dessa loja
            </p>
            <label className="block text-sm text-zinc-400">
              Nome
              <input
                required
                value={nomeAdmin}
                onChange={(e) => setNomeAdmin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              E-mail
              <input
                type="email"
                required
                value={emailAdmin}
                onChange={(e) => setEmailAdmin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Senha inicial
              <input
                type="password"
                required
                minLength={6}
                value={senhaAdmin}
                onChange={(e) => setSenhaAdmin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={criandoLoja}
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {criandoLoja ? 'Criando…' : 'Criar loja'}
              </button>
            </div>
          </form>
        )}

        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando…</p>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => {
              const expandido = tenantExpandido === tenant.id;
              return (
                <div
                  key={tenant.id}
                  className={['rounded-xl border bg-zinc-900', tenant.ativo ? 'border-zinc-800' : 'border-red-900'].join(
                    ' ',
                  )}
                >
                  <button
                    onClick={() => setTenantExpandido(expandido ? null : tenant.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <p className="flex items-center gap-2 font-medium text-zinc-100">
                        {tenant.nomeFantasia}
                        {!tenant.ativo && (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                            Suspensa
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {tenant.cnpj} · {tenant.usuarios.length} usuário(s) · criada em{' '}
                        {new Date(tenant.criadoEm).toLocaleDateString('pt-BR')}
                        {(tenant.telefone || tenant.email) && (
                          <>
                            {' · '}
                            {[tenant.telefone, tenant.email].filter(Boolean).join(' · ')}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={tenant.planoAtual}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleTrocarPlano(tenant.id, e.target.value as PlanoSaaS)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-100 focus:border-zinc-400 focus:outline-none"
                      >
                        {planos.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <span className="text-zinc-500">{expandido ? '−' : '+'}</span>
                    </div>
                  </button>

                  {expandido && (
                    <div className="border-t border-zinc-800 px-5 py-4">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-zinc-500">
                          <tr>
                            <th className="py-2 font-medium">Nome</th>
                            <th className="py-2 font-medium">E-mail</th>
                            <th className="py-2 font-medium">Papel</th>
                            <th className="py-2 font-medium">Status</th>
                            <th className="py-2 font-medium text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {tenant.usuarios.map((usuario) => (
                            <tr key={usuario.id}>
                              <td className="py-2.5 text-zinc-100">{usuario.nome}</td>
                              <td className="py-2.5 font-mono text-xs text-zinc-400">{usuario.email}</td>
                              <td className="py-2.5 text-zinc-300">{rotulosPapel[usuario.papel] ?? usuario.papel}</td>
                              <td className="py-2.5">
                                <span
                                  className={[
                                    'rounded-full px-2.5 py-1 text-xs font-medium',
                                    usuario.ativo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
                                  ].join(' ')}
                                >
                                  {usuario.ativo ? 'Ativo' : 'Desativado'}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleAtivo(usuario.id, !usuario.ativo)}
                                    className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                                  >
                                    {usuario.ativo ? 'Desativar' : 'Ativar'}
                                  </button>
                                  <button
                                    onClick={() => handleResetarSenha(usuario.id, usuario.nome)}
                                    className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                                  >
                                    Resetar senha
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-4 flex justify-end gap-2 border-t border-zinc-800 pt-4">
                        <button
                          onClick={() => handleToggleTenantAtivo(tenant)}
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                        >
                          {tenant.ativo ? 'Suspender loja' : 'Reativar loja'}
                        </button>
                        <button
                          onClick={() => {
                            setLojaParaExcluir(tenant);
                            setConfirmacaoExclusao('');
                          }}
                          className="rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-700 hover:bg-red-500/10"
                        >
                          Excluir loja
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="font-display text-lg font-semibold text-zinc-100">Senha redefinida</p>
            <p className="mt-1 text-sm text-zinc-400">
              Nova senha temporária para <span className="text-zinc-200">{senhaGerada.usuarioNome}</span>. Copie e
              repasse com segurança — ela não será mostrada de novo.
            </p>
            <p className="mt-4 select-all rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-center font-mono text-sm text-zinc-100">
              {senhaGerada.senha}
            </p>
            <button
              onClick={() => setSenhaGerada(null)}
              className="mt-5 w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-black hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {lojaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-red-900 bg-zinc-900 p-6">
            <p className="font-display text-lg font-semibold text-zinc-100">Excluir "{lojaParaExcluir.nomeFantasia}"</p>
            <p className="mt-1 text-sm text-zinc-400">
              Isso apaga a loja, seus produtos, vendas, clientes, financeiro e todos os logins — pra sempre. Não dá
              pra desfazer.
            </p>
            <p className="mt-4 text-sm text-zinc-400">
              Digite <span className="font-mono text-zinc-200">{lojaParaExcluir.nomeFantasia}</span> pra confirmar:
            </p>
            <input
              autoFocus
              value={confirmacaoExclusao}
              onChange={(e) => setConfirmacaoExclusao(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-red-500 focus:outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setLojaParaExcluir(null)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:text-zinc-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirLoja}
                disabled={excluindo || confirmacaoExclusao !== lojaParaExcluir.nomeFantasia}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {excluindo ? 'Excluindo…' : 'Excluir para sempre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
