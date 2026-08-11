import type {
  Categoria,
  Cliente,
  LancamentoFinanceiro,
  Produto,
  RelatorioVendas,
  ResumoDashboard,
  ResumoFinanceiro,
  Tenant,
  Transacao,
  TelaComPermissao,
  TipoLancamentoFinanceiro,
  Usuario,
  FormaPagamento,
  AtributoCustomizadoDefinicao,
  AtributoCustomizadoValor,
} from '@/types';

/**
 * ============================================================================
 * apiService.ts
 * ----------------------------------------------------------------------------
 * Cliente HTTP real para a API do Total Control (server/ — Express + Prisma).
 * Substitui o antigo mockDatabaseService.ts: nenhuma tela manipula dados
 * diretamente, tudo passa por uma função async exportada aqui.
 *
 * O tenant/usuário não são mais passados por parâmetro — a API resolve isso
 * a partir do JWT enviado no header Authorization, guardado em localStorage.
 * ============================================================================
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const CHAVE_TOKEN = 'total_control_token';

export function getToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function setToken(token: string): void {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function limparToken(): void {
  localStorage.removeItem(CHAVE_TOKEN);
}

class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = getToken();
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status} ao chamar ${caminho}`;
    try {
      const corpo = await resposta.json();
      if (corpo?.erro) mensagem = corpo.erro;
    } catch {
      // corpo sem JSON — mantém mensagem genérica
    }
    throw new ErroApi(mensagem, resposta.status);
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

// ----------------------------------------------------------------------------
// AUTENTICAÇÃO
// ----------------------------------------------------------------------------

export async function login(email: string, senha: string): Promise<void> {
  const { token } = await requisitar<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  setToken(token);
}

export interface RegistrarLojaPayload {
  nomeFantasia: string;
  cnpj: string;
  telefone?: string;
  emailContato?: string;
  nomeAdmin: string;
  email: string;
  senha: string;
}

export async function registrarLoja(payload: RegistrarLojaPayload): Promise<void> {
  const { token } = await requisitar<{ token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(token);
}

export async function getMe(): Promise<{ usuario: Usuario; tenant: Tenant }> {
  return requisitar('/auth/me');
}

export function logout(): void {
  limparToken();
}

// ----------------------------------------------------------------------------
// PRODUTOS
// ----------------------------------------------------------------------------

export async function getProducts(): Promise<Produto[]> {
  return requisitar('/produtos');
}

export async function searchProducts(termo: string): Promise<Produto[]> {
  return requisitar(`/produtos?q=${encodeURIComponent(termo)}`);
}

export interface NovoProdutoPayload {
  nome: string;
  sku: string;
  categoriaId: string;
  precoCusto: number;
  precoVenda: number;
  quantidadeEmEstoque: number;
  estoqueMinimo: number;
  atributosCustomizados?: AtributoCustomizadoValor[];
}

export async function createProduct(dados: NovoProdutoPayload): Promise<Produto> {
  return requisitar('/produtos', { method: 'POST', body: JSON.stringify(dados) });
}

export async function updateProduct(id: string, alteracoes: Partial<NovoProdutoPayload>): Promise<Produto> {
  return requisitar(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(alteracoes) });
}

export async function deactivateProduct(id: string): Promise<void> {
  await requisitar(`/produtos/${id}`, { method: 'DELETE' });
}

// ----------------------------------------------------------------------------
// CATEGORIAS
// ----------------------------------------------------------------------------

export async function getCategorias(): Promise<Categoria[]> {
  return requisitar('/categorias');
}

export async function createCategoria(
  nome: string,
  atributosCustomizados?: AtributoCustomizadoDefinicao[],
): Promise<Categoria> {
  return requisitar('/categorias', { method: 'POST', body: JSON.stringify({ nome, atributosCustomizados }) });
}

// ----------------------------------------------------------------------------
// CLIENTES
// ----------------------------------------------------------------------------

export async function getClientes(termo?: string): Promise<Cliente[]> {
  const query = termo ? `?q=${encodeURIComponent(termo)}` : '';
  return requisitar(`/clientes${query}`);
}

export interface NovoClientePayload {
  nome: string;
  telefone?: string;
  email?: string;
  cpfCnpj?: string;
}

export async function createCliente(dados: NovoClientePayload): Promise<Cliente> {
  return requisitar('/clientes', { method: 'POST', body: JSON.stringify(dados) });
}

// ----------------------------------------------------------------------------
// VENDAS (PDV)
// ----------------------------------------------------------------------------

export interface NovaVendaPayload {
  itens: Array<{ productId: string; quantidade: number; precoUnitario?: number }>;
  desconto?: number;
  taxas?: number;
  parcelas?: number;
  formaPagamento: FormaPagamento;
  clienteId?: string;
}

export async function registerSale(payload: NovaVendaPayload): Promise<Transacao> {
  return requisitar('/vendas', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getVendas(): Promise<Transacao[]> {
  return requisitar('/vendas');
}

// ----------------------------------------------------------------------------
// ESTOQUE
// ----------------------------------------------------------------------------

export interface NovaEntradaEstoquePayload {
  productId: string;
  quantidade: number;
  precoCustoUnitario?: number;
  observacao?: string;
}

export async function registerStockEntry(payload: NovaEntradaEstoquePayload): Promise<Transacao> {
  return requisitar('/estoque/entrada', { method: 'POST', body: JSON.stringify(payload) });
}

// ----------------------------------------------------------------------------
// DASHBOARD & RELATÓRIOS
// ----------------------------------------------------------------------------

export async function getDashboardResumo(): Promise<ResumoDashboard> {
  return requisitar('/dashboard/resumo');
}

export async function getRelatorioVendas(inicio?: string, fim?: string): Promise<RelatorioVendas> {
  const parametros = new URLSearchParams();
  if (inicio) parametros.set('inicio', inicio);
  if (fim) parametros.set('fim', fim);
  const query = parametros.toString() ? `?${parametros.toString()}` : '';
  return requisitar(`/relatorios/vendas${query}`);
}

// ----------------------------------------------------------------------------
// FINANCEIRO
// ----------------------------------------------------------------------------

function queryPeriodo(inicio?: string, fim?: string): string {
  const parametros = new URLSearchParams();
  if (inicio) parametros.set('inicio', inicio);
  if (fim) parametros.set('fim', fim);
  return parametros.toString() ? `?${parametros.toString()}` : '';
}

export async function getResumoFinanceiro(inicio?: string, fim?: string): Promise<ResumoFinanceiro> {
  return requisitar(`/financeiro/resumo${queryPeriodo(inicio, fim)}`);
}

export async function getLancamentos(inicio?: string, fim?: string): Promise<LancamentoFinanceiro[]> {
  return requisitar(`/financeiro/lancamentos${queryPeriodo(inicio, fim)}`);
}

export interface NovoLancamentoPayload {
  tipo: TipoLancamentoFinanceiro;
  categoria: string;
  descricao?: string;
  valor: number;
  data: string;
}

export async function createLancamento(payload: NovoLancamentoPayload): Promise<LancamentoFinanceiro> {
  return requisitar('/financeiro/lancamentos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteLancamento(id: string): Promise<void> {
  await requisitar(`/financeiro/lancamentos/${id}`, { method: 'DELETE' });
}

// ----------------------------------------------------------------------------
// USUÁRIOS (logins da própria loja)
// ----------------------------------------------------------------------------

export async function getUsuarios(): Promise<Usuario[]> {
  return requisitar('/usuarios');
}

export interface NovoUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  papel: 'ADMIN' | 'GERENTE' | 'OPERADOR_CAIXA';
  permissoes: TelaComPermissao[];
}

export async function createUsuario(dados: NovoUsuarioPayload): Promise<Usuario> {
  return requisitar('/usuarios', { method: 'POST', body: JSON.stringify(dados) });
}

export async function setUsuarioAtivo(id: string, ativo: boolean): Promise<void> {
  await requisitar(`/usuarios/${id}/ativo`, { method: 'PUT', body: JSON.stringify({ ativo }) });
}

export async function setUsuarioPermissoes(id: string, permissoes: TelaComPermissao[]): Promise<Usuario> {
  return requisitar(`/usuarios/${id}/permissoes`, { method: 'PUT', body: JSON.stringify({ permissoes }) });
}
