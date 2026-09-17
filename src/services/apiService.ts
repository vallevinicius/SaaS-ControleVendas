import type {
  Caixa,
  Categoria,
  Cliente,
  HistoricoCliente,
  LancamentoFinanceiro,
  Produto,
  ProdutoParaImportar,
  RegistroAuditoria,
  RelatorioConsolidado,
  RelatorioVendas,
  ResumoDashboard,
  ResumoFinanceiro,
  SugestaoReposicao,
  Tenant,
  Transacao,
  TelaComPermissao,
  LojaResumo,
  PaginaResultado,
  TipoLancamentoFinanceiro,
  Usuario,
  Vendedor,
  VendaResumo,
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

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
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

export class ErroApi extends Error {
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

export async function getMe(): Promise<{ usuario: Usuario; tenant: Tenant; lojas: LojaResumo[] }> {
  return requisitar('/auth/me');
}

export function logout(): void {
  limparToken();
}

// ----------------------------------------------------------------------------
// ADMIN DA PLATAFORMA (Total Software)
// ----------------------------------------------------------------------------
// Sessão separada da loja — chave própria no localStorage. A gestão de
// empresas/lojas em si acontece no TotalControl (totalSoftwareAdmin); aqui só
// autentica pra decidir se manda o usuário pra lá (ver AdminScreen.tsx).

const CHAVE_TOKEN_ADMIN = 'total_control_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN_ADMIN);
}

export function limparTokenAdmin(): void {
  localStorage.removeItem(CHAVE_TOKEN_ADMIN);
}

export async function loginAdmin(email: string, senha: string): Promise<void> {
  const resposta = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  if (!resposta.ok) {
    let mensagem = 'E-mail ou senha inválidos.';
    try {
      const corpo = await resposta.json();
      if (corpo?.erro) mensagem = corpo.erro;
    } catch {
      // corpo sem JSON — mantém mensagem genérica
    }
    throw new ErroApi(mensagem, resposta.status);
  }

  const { token } = await resposta.json();
  localStorage.setItem(CHAVE_TOKEN_ADMIN, token);
}

/** Reemite o token pra outra loja que o usuário tem acesso (ver `lojas` em getMe). */
export async function trocarLoja(tenantId: string): Promise<void> {
  const { token } = await requisitar<{ token: string }>('/auth/trocar-loja', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
  setToken(token);
}

export interface NovaLojaPayload {
  nomeFantasia: string;
  cnpj: string;
}

/** Criação self-service de uma loja adicional pra mesma empresa — só ENTERPRISE. */
export async function criarLoja(dados: NovaLojaPayload): Promise<{ id: string; nomeFantasia: string }> {
  return requisitar('/lojas', { method: 'POST', body: JSON.stringify(dados) });
}

// ----------------------------------------------------------------------------
// PRODUTOS
// ----------------------------------------------------------------------------

export interface RespostaProdutos extends PaginaResultado<Produto> {
  produtosComEstoqueBaixo: number;
}

/** Busca produtos com paginação; `termo` vazio traz a lista inteira (usado
 * tanto pela tela de Estoque quanto pela busca ao vivo do PDV). */
export async function searchProducts(termo: string, pagina = 1, tamanho = 20): Promise<RespostaProdutos> {
  return requisitar(`/produtos?q=${encodeURIComponent(termo)}&pagina=${pagina}&tamanho=${tamanho}`);
}

export async function getSugestaoReposicao(): Promise<SugestaoReposicao[]> {
  return requisitar('/produtos/sugestao-reposicao');
}

export async function importarProdutos(produtos: ProdutoParaImportar[]): Promise<{ criados: number }> {
  return requisitar('/produtos/importar', { method: 'POST', body: JSON.stringify({ produtos }) });
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

export async function getClientes(termo?: string, pagina = 1, tamanho = 20): Promise<PaginaResultado<Cliente>> {
  const params = new URLSearchParams();
  if (termo) params.set('q', termo);
  params.set('pagina', String(pagina));
  params.set('tamanho', String(tamanho));
  return requisitar(`/clientes?${params.toString()}`);
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

export async function getHistoricoCliente(id: string): Promise<HistoricoCliente> {
  return requisitar(`/clientes/${id}/historico`);
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
  vendedorId?: string;
}

export async function registerSale(payload: NovaVendaPayload): Promise<Transacao> {
  return requisitar('/vendas', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getVendas(): Promise<Transacao[]> {
  return requisitar('/vendas');
}

/** Desfaz a última venda do turno de caixa aberto (até 5 min depois dela). */
export async function desfazerUltimaVenda(): Promise<void> {
  await requisitar('/vendas/ultima/desfazer', { method: 'POST' });
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

export async function getRelatorioConsolidado(inicio?: string, fim?: string): Promise<RelatorioConsolidado> {
  const parametros = new URLSearchParams();
  if (inicio) parametros.set('inicio', inicio);
  if (fim) parametros.set('fim', fim);
  const query = parametros.toString() ? `?${parametros.toString()}` : '';
  return requisitar(`/relatorios/consolidado${query}`);
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

// ----------------------------------------------------------------------------
// CAIXA (turno de PDV — abrir/fechar)
// ----------------------------------------------------------------------------

export async function getCaixaAtual(): Promise<Caixa | null> {
  return requisitar('/caixa/atual');
}

export async function abrirCaixa(valorAbertura: number): Promise<Caixa> {
  return requisitar('/caixa/abrir', { method: 'POST', body: JSON.stringify({ valorAbertura }) });
}

export interface FecharCaixaPayload {
  valorContado?: number;
  observacao?: string;
}

export async function fecharCaixa(caixaId: string, payload: FecharCaixaPayload): Promise<Caixa> {
  return requisitar(`/caixa/${caixaId}/fechar`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function getHistoricoCaixas(): Promise<Caixa[]> {
  return requisitar('/caixa');
}

export async function getVendasDoCaixa(caixaId: string): Promise<VendaResumo[]> {
  return requisitar(`/caixa/${caixaId}/vendas`);
}

// ----------------------------------------------------------------------------
// VENDEDORES (quem fez a venda, pra apuração de comissão)
// ----------------------------------------------------------------------------

export async function getVendedores(): Promise<Vendedor[]> {
  return requisitar('/vendedores');
}

export interface NovoVendedorPayload {
  nome: string;
  comissaoPercentual?: number;
}

export async function createVendedor(dados: NovoVendedorPayload): Promise<Vendedor> {
  return requisitar('/vendedores', { method: 'POST', body: JSON.stringify(dados) });
}

export async function updateVendedor(
  id: string,
  dados: Partial<NovoVendedorPayload> & { ativo?: boolean },
): Promise<Vendedor> {
  return requisitar(`/vendedores/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
}

// ----------------------------------------------------------------------------
// AUDITORIA (trilha de "quem fez o quê" — só a conta principal vê)
// ----------------------------------------------------------------------------

export async function getAuditoria(pagina = 1, tamanho = 20): Promise<PaginaResultado<RegistroAuditoria>> {
  return requisitar(`/auditoria?pagina=${pagina}&tamanho=${tamanho}`);
}

// ----------------------------------------------------------------------------
// LOJAS (multi-loja — só ENTERPRISE)
// ----------------------------------------------------------------------------

export async function concederAcessoLoja(tenantId: string, usuarioId: string): Promise<void> {
  await requisitar(`/lojas/${tenantId}/acessos`, { method: 'POST', body: JSON.stringify({ usuarioId }) });
}

// ----------------------------------------------------------------------------
// APARÊNCIA DA LOJA
// ----------------------------------------------------------------------------

export interface AparenciaPayload {
  corPrincipalDoTema: string;
  corPrincipalHover?: string;
  logoDaLojaUrl?: string;
}

export async function atualizarAparencia(
  payload: AparenciaPayload,
): Promise<{ logoDaLojaUrl: string; corPrincipalDoTema: string; corPrincipalHover?: string }> {
  return requisitar('/tenant/aparencia', { method: 'PUT', body: JSON.stringify(payload) });
}
