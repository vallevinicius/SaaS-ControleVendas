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
 *
 * A cor de acento do app (--tenant-primary) NÃO vem mais daqui — é
 * monocromática e definida por tema (claro/escuro) em src/index.css,
 * controlada pelo ThemeContext.
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
