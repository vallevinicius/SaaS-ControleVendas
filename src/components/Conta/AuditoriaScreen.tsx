import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { Paginacao } from '@/components/Common/Paginacao';
import { getAuditoria } from '@/services/apiService';
import type { RegistroAuditoria } from '@/types';

const ROTULOS_ACAO: Record<string, string> = {
  'usuario.criar': 'Criou o login',
  'usuario.ativar': 'Ativou o login',
  'usuario.desativar': 'Desativou o login',
  'produto.excluir': 'Excluiu o produto',
  'produto.importarCsv': 'Importou produtos via planilha',
  'financeiro.excluirLancamento': 'Excluiu o lançamento',
  'caixa.fechar': 'Fechou o caixa',
  'venda.desfazer': 'Desfez uma venda',
  'loja.criar': 'Criou a loja',
  'loja.concederAcesso': 'Concedeu acesso de loja',
  'loja.personalizarAparencia': 'Alterou a cor da loja',
};

export function AuditoriaScreen() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const resultado = await getAuditoria(pagina);
      setRegistros(resultado.itens);
      setTotalPaginas(resultado.totalPaginas);
      setTotal(resultado.total);
      setCarregando(false);
    }
    carregar();
  }, [pagina]);

  return (
    <AppLayout titulo="Auditoria" subtitulo="Ações sensíveis feitas pelos logins da sua loja">
      {carregando ? (
        <LoadingState mensagem="Carregando…" />
      ) : registros.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700 p-10 text-center">
          <p className="text-sm text-ink-400">Nenhuma ação registrada ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-800 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Quando</th>
                <th className="px-5 py-3 font-medium">Quem</th>
                <th className="px-5 py-3 font-medium">Ação</th>
                <th className="px-5 py-3 font-medium">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700 bg-ink-800/40">
              {registros.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink-400">
                    {new Date(r.criadoEm).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-ink-100">{r.usuarioNome}</td>
                  <td className="px-5 py-3.5 text-ink-300">{ROTULOS_ACAO[r.acao] ?? r.acao}</td>
                  <td className="px-5 py-3.5 text-ink-400">{r.detalhe ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao pagina={pagina} totalPaginas={totalPaginas} total={total} aoMudarPagina={setPagina} />
    </AppLayout>
  );
}
