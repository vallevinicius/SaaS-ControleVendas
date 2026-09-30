import { useState, type FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { excluirLoja } from '@/services/apiService';
import { ModalFundo } from '@/components/Admin/AdminModais';
import type { LojaGestao } from '@/types';

/** Exclusão definitiva de uma loja (LGPD): pede o CNPJ da loja e a senha de
 * quem está excluindo. O servidor confere os dois de novo. */
export function ExcluirLojaModal({ loja, onFechar, onExcluida }: { loja: LojaGestao; onFechar: () => void; onExcluida: () => void }) {
  const toast = useToast();
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const cnpjConfere = cnpj.replace(/\D/g, '') === loja.cnpj.replace(/\D/g, '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cnpjConfere || !senha) return;
    setExcluindo(true);
    try {
      await excluirLoja(loja.id, { senha, cnpj });
      toast.sucesso(`Loja "${loja.nomeFantasia}" excluída.`);
      onExcluida();
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao excluir a loja.');
    } finally {
      setExcluindo(false);
    }
  }

  const campo = 'mt-1.5 w-full rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-sm text-ink-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20';

  return (
    <ModalFundo onFechar={onFechar}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Excluir "{loja.nomeFantasia}"</p>
        <p className="mt-2 text-sm text-ink-400">
          Apaga a loja e tudo o que pertence a ela: produtos, vendas, clientes, financeiro, caixas, vendedores, histórico e
          os logins criados nela. <span className="font-medium text-red-400">Não dá para desfazer.</span> Se só quiser pausar,
          use "Desativar".
        </p>
        <label className="mt-4 block text-sm text-ink-300">
          Digite o CNPJ da loja (<span className="font-mono text-ink-100">{loja.cnpj}</span>)
          <input autoFocus value={cnpj} onChange={(e) => setCnpj(e.target.value)} inputMode="numeric" className={campo} />
        </label>
        <label className="mt-3 block text-sm text-ink-300">
          Sua senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Cancelar</button>
          <button type="submit" disabled={excluindo || !cnpjConfere || !senha}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {excluindo ? 'Excluindo…' : 'Excluir para sempre'}
          </button>
        </div>
      </form>
    </ModalFundo>
  );
}
