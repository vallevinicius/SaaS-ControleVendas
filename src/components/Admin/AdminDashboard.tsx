import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/contexts/ToastContext';
import { adminListTenants, adminSetPlano, adminSetUsuarioAtivo, adminResetarSenha } from '@/services/adminApiService';
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
  const [tenants, setTenants] = useState<TenantAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tenantExpandido, setTenantExpandido] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ usuarioNome: string; senha: string } | null>(null);

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
        <p className="mb-6 text-sm text-zinc-400">
          {tenants.length} loja(s) cadastrada(s) na plataforma.
        </p>

        {carregando ? (
          <p className="text-sm text-zinc-500">Carregando…</p>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => {
              const expandido = tenantExpandido === tenant.id;
              return (
                <div key={tenant.id} className="rounded-xl border border-zinc-800 bg-zinc-900">
                  <button
                    onClick={() => setTenantExpandido(expandido ? null : tenant.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <p className="font-medium text-zinc-100">{tenant.nomeFantasia}</p>
                      <p className="text-xs text-zinc-500">
                        {tenant.cnpj} · {tenant.usuarios.length} usuário(s)
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
    </div>
  );
}
