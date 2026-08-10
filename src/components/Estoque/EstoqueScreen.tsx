import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { EstoqueBadge } from '@/components/Common/EstoqueBadge';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
  getProducts,
  getCategorias,
  registerStockEntry,
  createProduct,
  createCategoria,
  deactivateProduct,
} from '@/services/apiService';
import { formatarMoeda } from '@/utils/formatters';
import type { Categoria, Produto } from '@/types';
import { EntradaEstoqueModal } from './EntradaEstoqueModal';
import { NovoProdutoModal } from './NovoProdutoModal';

export function EstoqueScreen() {
  const { tenant } = useTenant();
  const toast = useToast();
  const confirmar = useConfirm();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [produtoParaEntrada, setProdutoParaEntrada] = useState<Produto | null>(null);
  const [mostrarNovoProduto, setMostrarNovoProduto] = useState(false);

  async function carregarDados() {
    setCarregando(true);
    const [produtosCarregados, categoriasCarregadas] = await Promise.all([getProducts(), getCategorias()]);
    setProdutos(produtosCarregados);
    setCategorias(categoriasCarregadas);
    setCarregando(false);
  }

  useEffect(() => {
    if (tenant) carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  function nomeCategoria(categoriaId: string): string {
    return categorias.find((c) => c.id === categoriaId)?.nome ?? 'Sem categoria';
  }

  async function confirmarEntrada(produto: Produto, quantidade: number, precoCustoUnitario?: number) {
    try {
      await registerStockEntry({ productId: produto.id, quantidade, precoCustoUnitario });
      await carregarDados();
      toast.sucesso(`Entrada de ${quantidade} un. registrada em "${produto.nome}".`);
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao registrar entrada de estoque.');
    }
  }

  async function excluirProduto(produto: Produto) {
    const confirmou = await confirmar({
      titulo: `Excluir "${produto.nome}"?`,
      descricao: 'Ele deixará de aparecer no estoque e no PDV.',
      textoConfirmar: 'Excluir',
      perigoso: true,
    });
    if (!confirmou) return;

    try {
      await deactivateProduct(produto.id);
      await carregarDados();
      toast.sucesso(`"${produto.nome}" excluído.`);
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao excluir produto.');
    }
  }

  const produtosComEstoqueBaixo = produtos.filter((p) => p.quantidadeEmEstoque <= p.estoqueMinimo).length;

  return (
    <AppLayout
      titulo="Gestão de Estoque"
      subtitulo={
        produtosComEstoqueBaixo > 0
          ? `${produtosComEstoqueBaixo} produto(s) com estoque em nível baixo`
          : 'Todos os produtos estão em níveis saudáveis de estoque'
      }
    >
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setMostrarNovoProduto(true)}
          className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Novo produto
        </button>
      </div>

      {carregando ? (
        <LoadingState mensagem="Carregando estoque…" />
      ) : produtos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700 p-10 text-center">
          <p className="text-sm text-ink-400">Nenhum produto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-800 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium text-right">Custo</th>
                <th className="px-5 py-3 font-medium text-right">Venda</th>
                <th className="px-5 py-3 font-medium text-right">Em estoque</th>
                <th className="px-5 py-3 font-medium">Situação</th>
                <th className="px-5 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700 bg-ink-800/40">
              {produtos.map((produto) => (
                <tr key={produto.id} className="transition-colors hover:bg-ink-800">
                  <td className="px-5 py-3.5 font-medium text-ink-100">{produto.nome}</td>
                  <td className="px-5 py-3.5 text-ink-300">{nomeCategoria(produto.categoriaId)}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-400">{produto.sku}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink-300">
                    {formatarMoeda(produto.precoCusto, tenant)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink-100">
                    {formatarMoeda(produto.precoVenda, tenant)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink-100">{produto.quantidadeEmEstoque}</td>
                  <td className="px-5 py-3.5">
                    <EstoqueBadge quantidadeEmEstoque={produto.quantidadeEmEstoque} estoqueMinimo={produto.estoqueMinimo} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setProdutoParaEntrada(produto)}
                        className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-tenant hover:text-tenant"
                      >
                        + Entrada
                      </button>
                      <button
                        onClick={() => excluirProduto(produto)}
                        className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-red-400 hover:text-red-400"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {produtoParaEntrada && (
        <EntradaEstoqueModal
          produto={produtoParaEntrada}
          aoFechar={() => setProdutoParaEntrada(null)}
          aoConfirmar={(quantidade, precoCustoUnitario) =>
            confirmarEntrada(produtoParaEntrada, quantidade, precoCustoUnitario)
          }
        />
      )}

      {mostrarNovoProduto && (
        <NovoProdutoModal
          categorias={categorias}
          aoFechar={() => setMostrarNovoProduto(false)}
          aoConfirmar={async (dados) => {
            await createProduct(dados);
            await carregarDados();
          }}
          aoCriarCategoria={async (nome) => {
            const categoria = await createCategoria(nome);
            setCategorias((atual) => [...atual, categoria]);
            return categoria;
          }}
        />
      )}
    </AppLayout>
  );
}
