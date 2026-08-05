import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Tenant, Usuario } from '@/types';
import {
  getMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  registrarLoja,
  type RegistrarLojaPayload,
} from '@/services/apiService';

/**
 * TenantContext
 * ----------------------------------------------------------------------------
 * Fonte única de verdade para "quem está logado agora" em toda a aplicação:
 * tenant (loja) + usuário, resolvidos a partir do JWT guardado em
 * localStorage. Nenhuma tela deve buscar esses dados de outro lugar.
 * ----------------------------------------------------------------------------
 */

interface TenantContextValue {
  tenant: Tenant | null;
  usuarioAtual: Usuario | null;
  carregando: boolean;
  erro: string | null;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (payload: RegistrarLojaPayload) => Promise<void>;
  logout: () => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

/** Aplica a cor do tenant como variáveis CSS globais (--tenant-primary etc). */
function aplicarVariaveisDeTema(tenant: Tenant | null) {
  const root = document.documentElement;
  if (!tenant) return;

  const cor = tenant.configuracoes.corPrincipalDoTema;
  root.style.setProperty('--tenant-primary', cor);
  root.style.setProperty('--tenant-primary-hover', tenant.configuracoes.corPrincipalHover ?? escurecerHex(cor, 0.15));
  root.style.setProperty('--tenant-primary-soft', hexParaRgba(cor, 0.14));
}

function escurecerHex(hex: string, fator: number): string {
  const { r, g, b } = hexParaRgb(hex);
  const escurecer = (canal: number) => Math.max(0, Math.round(canal * (1 - fator)));
  return `#${[escurecer(r), escurecer(g), escurecer(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function hexParaRgb(hex: string): { r: number; g: number; b: number } {
  const limpo = hex.replace('#', '');
  const bigint = parseInt(limpo, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function hexParaRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexParaRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarSessao() {
    setCarregando(true);
    setErro(null);
    try {
      if (!getToken()) {
        setTenant(null);
        setUsuarioAtual(null);
        return;
      }
      const { usuario, tenant: tenantCarregado } = await getMe();
      setUsuarioAtual(usuario);
      setTenant(tenantCarregado);
      aplicarVariaveisDeTema(tenantCarregado);
    } catch {
      // Token ausente/expirado/inválido — volta ao estado deslogado.
      apiLogout();
      setTenant(null);
      setUsuarioAtual(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSessao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, senha: string) {
    setErro(null);
    try {
      await apiLogin(email, senha);
      await carregarSessao();
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro ao entrar.';
      setErro(mensagem);
      throw e;
    }
  }

  async function registrar(payload: RegistrarLojaPayload) {
    setErro(null);
    try {
      await registrarLoja(payload);
      await carregarSessao();
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro ao registrar loja.';
      setErro(mensagem);
      throw e;
    }
  }

  function logout() {
    apiLogout();
    setTenant(null);
    setUsuarioAtual(null);
  }

  const value = useMemo<TenantContextValue>(
    () => ({
      tenant,
      usuarioAtual,
      carregando,
      erro,
      autenticado: Boolean(tenant && usuarioAtual),
      login,
      registrar,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenant, usuarioAtual, carregando, erro],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

/** Hook de acesso à sessão ativa. Lança erro se usado fora do Provider. */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant precisa ser usado dentro de um <TenantProvider>.');
  }
  return context;
}
