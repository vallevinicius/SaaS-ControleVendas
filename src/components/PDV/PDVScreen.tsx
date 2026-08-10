import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { searchProducts, registerSale, getClientes } from '@/services/apiService';
import { formatarMoeda } from '@/utils/formatters';
import type { Cliente, FormaPagamento, Produto } from '@/types';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

const formasPagamento: Array<{ valor: FormaPagamento; rotulo: string }> = [
  { valor: 'PIX', rotulo: 'Pix' },
  { valor: 'CARTAO_CREDITO', rotulo: 'Cartão de Crédito' },
  { valor: 'CARTAO_DEBITO', rotulo: 'Cartão de Débito' },
  { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
];

/**
 * Tela de Frente de Caixa (PDV):
 * - Busca produto por nome/SKU
 * - Adiciona quantidade ao carrinho
 * - Mostra total em tempo real
 * - Permite vincular um cliente (opcional)
 * - Fecha a venda com forma de pagamento e desconto
 *
 * A tela NÃO manipula nenhum array de dados global: toda leitura/escrita
 * passa pelo apiService, autenticado via JWT do tenant/usuário logados.
 */
export function PDVScreen() {
  const { tenant } = useTenant();
  const toast = useToast();
  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [desconto, setDesconto] = useState<number>(0);
  const [processando, setProcessando] = useState(false);

  const [termoCliente, setTermoCliente] = useState('');
  const [resultadosClientes, setResultadosClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  useEffect(() => {
    const termo = termoBusca.trim();
    if (termo.length === 0) {
      setResultados([]);
      return;
    }
    let cancelado = false;
    searchProducts(termo).then((produtos) => {
      if (!cancelado) setResultados(produtos);
    });
    return () => {
      cancelado = true;
    };
  }, [termoBusca]);

  useEffect(() => {
    const termo = termoCliente.trim();
    if (termo.length === 0) {
      setResultadosClientes([]);
      return;
    }
    let cancelado = false;
    getClientes(termo).then((clientes) => {
      if (!cancelado) setResultadosClientes(clientes);
    });
    return () => {
      cancelado = true;
    };
  }, [termoCliente]);

  function adicionarAoCarrinho(produto: Produto) {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id);
      if (existente) {
        return atual.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...atual, { produto, quantidade: 1 }];
    });
    setTermoBusca('');
    setResultados([]);
  }

  function alterarQuantidade(productId: string, quantidade: number) {
    if (quantidade <= 0) {
      setCarrinho((atual) => atual.filter((i) => i.produto.id !== productId));
      return;
    }
    setCarrinho((atual) => atual.map((i) => (i.produto.id === productId ? { ...i, quantidade } : i)));
  }

  const totalBruto = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.produto.precoVenda * i.quantidade, 0),
    [carrinho],
  );
  const totalLiquido = Math.max(0, totalBruto - desconto);

  async function finalizarVenda() {
    if (carrinho.length === 0) return;
    setProcessando(true);
    try {
      await registerSale({
        itens: carrinho.map((i) => ({ productId: i.produto.id, quantidade: i.quantidade })),
        desconto,
        taxas: 0,
        formaPagamento,
        clienteId: clienteSelecionado?.id,
      });
      toast.sucesso(`Venda finalizada às ${new Date().toLocaleTimeString('pt-BR')}.`);
      setCarrinho([]);
      setDesconto(0);
      setClienteSelecionado(null);
      setTermoCliente('');
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao finalizar venda.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <AppLayout titulo="Frente de Caixa" subtitulo="Busque um produto, monte o carrinho e finalize a venda">
      <div className="grid h-full grid-cols-[1fr_380px] gap-6">
        {/* Coluna de busca + resultados */}
        <section className="flex flex-col gap-4">
          <div className="relative">
            <input
              autoFocus
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar produto por nome ou SKU…"
              className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3.5 text-base text-ink-100 placeholder:text-ink-400 focus:border-tenant focus:outline-none focus:ring-2 focus:ring-tenant/30"
            />
          </div>

          {resultados.length > 0 && (
            <ul className="divide-y divide-ink-700 rounded-xl border border-ink-700 bg-ink-800">
              {resultados.map((produto) => (
                <li key={produto.id}>
                  <button
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.quantidadeEmEstoque === 0}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-100">{produto.nome}</p>
                      <p className="text-xs text-ink-400">
                        SKU {produto.sku} · {produto.quantidadeEmEstoque} em estoque
                      </p>
                    </div>
                    <span className="font-mono text-sm text-tenant">{formatarMoeda(produto.precoVenda, tenant)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex-1 rounded-xl border border-dashed border-ink-700 p-6">
            <p className="mb-4 text-sm font-medium text-ink-200">Carrinho</p>
            {carrinho.length === 0 ? (
              <p className="text-sm text-ink-400">Nenhum item adicionado ainda. Use a busca acima.</p>
            ) : (
              <ul className="space-y-3">
                {carrinho.map((item) => (
                  <li key={item.produto.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-100">{item.produto.nome}</p>
                      <p className="text-xs text-ink-400">{formatarMoeda(item.produto.precoVenda, tenant)} / un.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                        className="h-7 w-7 rounded-md bg-ink-700 text-ink-100 hover:bg-ink-600"
                        aria-label={`Diminuir quantidade de ${item.produto.nome}`}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm text-ink-100">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                        disabled={item.quantidade >= item.produto.quantidadeEmEstoque}
                        className="h-7 w-7 rounded-md bg-ink-700 text-ink-100 hover:bg-ink-600 disabled:opacity-40"
                        aria-label={`Aumentar quantidade de ${item.produto.nome}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="w-24 text-right font-mono text-sm text-ink-100">
                      {formatarMoeda(item.produto.precoVenda * item.quantidade, tenant)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Coluna de resumo/fechamento */}
        <aside className="flex flex-col rounded-xl border border-ink-700 bg-ink-800 p-6">
          <p className="mb-6 font-display text-lg font-semibold text-ink-100">Resumo da venda</p>

          <div className="relative mb-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400">
              Cliente (opcional)
            </label>
            {clienteSelecionado ? (
              <div className="flex items-center justify-between rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm text-ink-100">
                <span className="truncate">{clienteSelecionado.nome}</span>
                <button
                  onClick={() => setClienteSelecionado(null)}
                  className="ml-2 text-ink-400 hover:text-ink-100"
                  aria-label="Remover cliente selecionado"
                >
                  ×
                </button>
              </div>
            ) : (
              <input
                value={termoCliente}
                onChange={(e) => setTermoCliente(e.target.value)}
                placeholder="Buscar cliente…"
                className="w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-tenant focus:outline-none"
              />
            )}
            {!clienteSelecionado && resultadosClientes.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full divide-y divide-ink-700 rounded-lg border border-ink-700 bg-ink-800 shadow-lg">
                {resultadosClientes.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      onClick={() => {
                        setClienteSelecionado(cliente);
                        setTermoCliente('');
                        setResultadosClientes([]);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-ink-100 hover:bg-ink-700"
                    >
                      {cliente.nome}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-ink-300">
              <span>Subtotal</span>
              <span className="font-mono">{formatarMoeda(totalBruto, tenant)}</span>
            </div>
            <label className="flex items-center justify-between text-ink-300">
              <span>Desconto</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                className="w-24 rounded-md border border-ink-600 bg-ink-700 px-2 py-1 text-right font-mono text-ink-100 focus:border-tenant focus:outline-none"
              />
            </label>
          </div>

          <div className="my-5 border-t border-ink-700" />

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-300">Total</span>
            <span className="font-display text-3xl font-semibold text-tenant">{formatarMoeda(totalLiquido, tenant)}</span>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {formasPagamento.map((forma) => (
                <button
                  key={forma.valor}
                  onClick={() => setFormaPagamento(forma.valor)}
                  className={[
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    formaPagamento === forma.valor
                      ? 'border-tenant bg-tenant-soft text-tenant'
                      : 'border-ink-600 text-ink-300 hover:border-ink-500',
                  ].join(' ')}
                >
                  {forma.rotulo}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0 || processando}
            className="mt-auto pt-6 text-center"
          >
            <span
              className={[
                'block w-full rounded-xl bg-tenant py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90',
                (carrinho.length === 0 || processando) && 'cursor-not-allowed opacity-40',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {processando ? 'Finalizando…' : 'Finalizar venda'}
            </span>
          </button>
        </aside>
      </div>
    </AppLayout>
  );
}
