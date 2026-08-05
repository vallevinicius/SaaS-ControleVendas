import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminLogin, adminLogout, adminListTenants, getAdminToken } from '@/services/adminApiService';

/**
 * AdminAuthContext
 * ----------------------------------------------------------------------------
 * Sessão do painel interno da Total Software (/admin), completamente
 * independente do TenantContext (loja logada). Usa sua própria chave de
 * token em localStorage — as duas sessões podem existir ao mesmo tempo no
 * mesmo navegador sem conflito.
 * ----------------------------------------------------------------------------
 */

interface AdminAuthContextValue {
  autenticado: boolean;
  carregando: boolean;
  erro: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      const token = getAdminToken();
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        // Não há endpoint "/me" para admin — valida o token testando a
        // primeira chamada real que a tela vai precisar de qualquer forma.
        await adminListTenants();
        setAutenticado(true);
      } catch {
        adminLogout();
        setAutenticado(false);
      } finally {
        setCarregando(false);
      }
    }
    verificarSessao();
  }, []);

  async function login(email: string, senha: string) {
    setErro(null);
    try {
      await adminLogin(email, senha);
      setAutenticado(true);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Erro ao entrar.';
      setErro(mensagem);
      throw e;
    }
  }

  function logout() {
    adminLogout();
    setAutenticado(false);
  }

  const value = useMemo<AdminAuthContextValue>(
    () => ({ autenticado, carregando, erro, login, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autenticado, carregando, erro],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth precisa ser usado dentro de um <AdminAuthProvider>.');
  }
  return context;
}
