import type { PlanoSaaS, EmpresaAdmin } from '@/types';

/**
 * ============================================================================
 * adminApiService.ts
 * ----------------------------------------------------------------------------
 * Cliente HTTP do painel interno da Total Software (/admin), separado do
 * apiService.ts usado pelas lojas: usa outra chave de token em localStorage
 * para as duas sessões (loja + admin da plataforma) poderem conviver sem
 * conflito no mesmo navegador.
 * ============================================================================
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const CHAVE_TOKEN = 'total_control_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

function setAdminToken(token: string): void {
  localStorage.setItem(CHAVE_TOKEN, token);
}

function limparAdminToken(): void {
  localStorage.removeItem(CHAVE_TOKEN);
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
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
    throw new Error(mensagem);
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

export async function adminLogin(email: string, senha: string): Promise<void> {
  const { token } = await requisitar<{ token: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  setAdminToken(token);
}

export function adminLogout(): void {
  limparAdminToken();
}

export async function adminListEmpresas(): Promise<EmpresaAdmin[]> {
  return requisitar('/admin/empresas');
}

export async function adminSetPlano(empresaId: string, planoAtual: PlanoSaaS): Promise<void> {
  await requisitar(`/admin/empresas/${empresaId}/plano`, {
    method: 'PUT',
    body: JSON.stringify({ planoAtual }),
  });
}

export interface NovaEmpresaPayload {
  nomeFantasia: string;
  razaoSocial?: string;
  cnpj: string;
  telefone?: string;
  email?: string;
  planoAtual: PlanoSaaS;
  nomeAdmin: string;
  emailAdmin: string;
  senhaAdmin: string;
}

export async function adminCreateEmpresa(payload: NovaEmpresaPayload): Promise<void> {
  await requisitar('/admin/empresas', { method: 'POST', body: JSON.stringify(payload) });
}

export async function adminSetEmpresaAtivo(empresaId: string, ativo: boolean): Promise<void> {
  await requisitar(`/admin/empresas/${empresaId}/ativo`, {
    method: 'PUT',
    body: JSON.stringify({ ativo }),
  });
}

export async function adminDeleteEmpresa(empresaId: string): Promise<void> {
  await requisitar(`/admin/empresas/${empresaId}`, { method: 'DELETE' });
}

export async function adminSetUsuarioAtivo(usuarioId: string, ativo: boolean): Promise<void> {
  await requisitar(`/admin/usuarios/${usuarioId}/ativo`, {
    method: 'PUT',
    body: JSON.stringify({ ativo }),
  });
}

export async function adminResetarSenha(usuarioId: string): Promise<string> {
  const { senhaTemporaria } = await requisitar<{ senhaTemporaria: string }>(
    `/admin/usuarios/${usuarioId}/resetar-senha`,
    { method: 'POST' },
  );
  return senhaTemporaria;
}
