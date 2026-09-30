import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { concederAcessoLoja, listarAcessosLoja, listarUsuariosDaEmpresa, revogarAcessoLoja } from '@/services/apiService';
import { LoadingState } from '@/components/Common/LoadingState';
import { ModalFundo } from '@/components/Admin/AdminModais';
import type { AcessoDaLoja, LojaGestao, UsuarioDaEmpresa } from '@/types';

const ROTULOS_PAPEL = { ADMIN: 'Admin', GERENTE: 'Gerente', OPERADOR_CAIXA: 'Operador de caixa' } as const;

/** Quem entra nesta loja: usuários dela e os que receberam acesso extra. Só o
 * acesso extra se concede e revoga aqui; o acesso próprio depende do usuário. */
export function AcessosLojaModal({ loja, onFechar }: { loja: LojaGestao; onFechar: () => void }) {
  const toast = useToast();
  const confirmar = useConfirm();
  const [acessos, setAcessos] = useState<AcessoDaLoja[] | null>(null);
  const [empresa, setEmpresa] = useState<UsuarioDaEmpresa[]>([]);
  const [novoUsuario, setNovoUsuario] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [lista, usuarios] = await Promise.all([listarAcessosLoja(loja.id), listarUsuariosDaEmpresa()]);
      setAcessos(lista);
      setEmpresa(usuarios);
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao carregar os acessos.');
      onFechar();
    }
  }, [loja.id, toast, onFechar]);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidatos = empresa.filter((u) => !acessos?.some((a) => a.id === u.id));

  async function conceder() {
    if (!novoUsuario) return;
    setSalvando(true);
    try {
      await concederAcessoLoja(loja.id, novoUsuario);
      toast.sucesso('Acesso concedido.');
      setNovoUsuario('');
      await carregar();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao conceder o acesso.');
    } finally {
      setSalvando(false);
    }
  }

  async function revogar(acesso: AcessoDaLoja) {
    const ok = await confirmar({
      titulo: `Remover o acesso de ${acesso.nome}?`,
      descricao: `Ele deixa de conseguir entrar em "${loja.nomeFantasia}". Nada é apagado.`,
      textoConfirmar: 'Remover',
      perigoso: true,
    });
    if (!ok) return;
    try {
      await revogarAcessoLoja(loja.id, acesso.id);
      toast.sucesso('Acesso removido.');
      await carregar();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao remover o acesso.');
    }
  }

  return (
    <ModalFundo onFechar={onFechar}>
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-ink-700 bg-ink-800">
        <div className="border-b border-ink-700 px-6 py-4">
          <p className="font-display text-lg font-semibold text-ink-100">Acessos</p>
          <p className="text-sm text-ink-400">{loja.nomeFantasia}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!acessos ? (
            <LoadingState mensagem="Carregando acessos…" />
          ) : (
            <ul className="divide-y divide-ink-700">
              {acessos.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-ink-100">
                      {a.nome}
                      <span className={['rounded-full px-2 py-0.5 text-[11px] font-medium', a.origem === 'PROPRIO' ? 'bg-ink-700 text-ink-300' : 'bg-tenant-soft text-tenant'].join(' ')}>
                        {a.origem === 'PROPRIO' ? 'Da loja' : 'Acesso extra'}
                      </span>
                      {!a.ativo && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">Desativado</span>}
                    </p>
                    <p className="truncate text-xs text-ink-500">{a.email} · {ROTULOS_PAPEL[a.papel]}</p>
                  </div>
                  {a.origem === 'CONCEDIDO' && (
                    <button onClick={() => revogar(a)} className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-ink-700 px-6 py-4">
          <p className="text-sm font-medium text-ink-200">Dar acesso a outro usuário da empresa</p>
          <div className="mt-2 flex gap-2">
            <select
              value={novoUsuario}
              onChange={(e) => setNovoUsuario(e.target.value)}
              disabled={candidatos.length === 0}
              className="min-w-0 flex-1 rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2 text-sm text-ink-100 focus:border-tenant focus:outline-none disabled:opacity-50"
            >
              <option value="">{candidatos.length === 0 ? 'Todos já têm acesso' : 'Escolha um usuário'}</option>
              {candidatos.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} · {u.lojaNome}</option>
              ))}
            </select>
            <button onClick={conceder} disabled={!novoUsuario || salvando} className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:opacity-40">
              Conceder
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Fechar</button>
          </div>
        </div>
      </div>
    </ModalFundo>
  );
}
