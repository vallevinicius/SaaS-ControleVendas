import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoadingState } from '@/components/Common/LoadingState';
import { DashboardScreen } from '@/components/Dashboard/DashboardScreen';
import { PDVScreen } from '@/components/PDV/PDVScreen';
import { EstoqueScreen } from '@/components/Estoque/EstoqueScreen';
import { ClientesScreen } from '@/components/Clientes/ClientesScreen';
import { VendedoresScreen } from '@/components/Vendedores/VendedoresScreen';
import { RelatoriosScreen } from '@/components/Relatorios/RelatoriosScreen';
import { FinanceiroScreen } from '@/components/Financeiro/FinanceiroScreen';
import { UsuariosScreen } from '@/components/Usuarios/UsuariosScreen';
import { LoginScreen } from '@/components/Auth/LoginScreen';
import { RegisterScreen } from '@/components/Auth/RegisterScreen';
import { AdminLoginScreen } from '@/components/Admin/AdminLoginScreen';
import { AdminDashboard } from '@/components/Admin/AdminDashboard';
import { podeVerTela } from '@/utils/permissoes';
import type { TelaComPermissao } from '@/types';

function TelaCarregando() {
  return (
    <div className="flex h-screen items-center justify-center bg-ink-900">
      <LoadingState mensagem="Carregando sessão…" />
    </div>
  );
}

/** Rotas da loja (tenant) — sessão resolvida via TenantContext. Se `tela` for
 * informado, também exige que o usuário logado tenha permissão pra ela
 * (ADMIN sempre tem; usuários sem permissoes.length também têm, pra não
 * bloquear contas de antes desse recurso existir). */
function RotaProtegida({ children, tela }: { children: ReactNode; tela?: TelaComPermissao }) {
  const { autenticado, carregando, usuarioAtual } = useTenant();
  if (carregando) return <TelaCarregando />;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (tela && !podeVerTela(usuarioAtual, tela)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RotaPublica({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useTenant();
  if (carregando) return <TelaCarregando />;
  if (autenticado) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Rotas do painel interno da Total Software — sessão via AdminAuthContext,
 * totalmente independente da sessão de loja acima. */
function RotaAdminProtegida({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAdminAuth();
  if (carregando) return <TelaCarregando />;
  if (!autenticado) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RotaAdminPublica({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useAdminAuth();
  if (carregando) return <TelaCarregando />;
  if (autenticado) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function Roteador() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RotaPublica>
            <LoginScreen />
          </RotaPublica>
        }
      />
      <Route
        path="/registrar"
        element={
          <RotaPublica>
            <RegisterScreen />
          </RotaPublica>
        }
      />
      <Route
        path="/"
        element={
          <RotaProtegida tela="dashboard">
            <DashboardScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/pdv"
        element={
          <RotaProtegida tela="pdv">
            <PDVScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/estoque"
        element={
          <RotaProtegida tela="estoque">
            <EstoqueScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/financeiro"
        element={
          <RotaProtegida tela="financeiro">
            <FinanceiroScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/clientes"
        element={
          <RotaProtegida tela="clientes">
            <ClientesScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/vendedores"
        element={
          <RotaProtegida tela="vendedores">
            <VendedoresScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/relatorios"
        element={
          <RotaProtegida tela="relatorios">
            <RelatoriosScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RotaProtegida>
            <UsuariosScreen />
          </RotaProtegida>
        }
      />

      {/* Painel interno da Total Software — não linkado em nenhum menu da
          loja, acesso só por URL direta. */}
      <Route
        path="/admin/login"
        element={
          <RotaAdminPublica>
            <AdminLoginScreen />
          </RotaAdminPublica>
        }
      />
      <Route
        path="/admin"
        element={
          <RotaAdminProtegida>
            <AdminDashboard />
          </RotaAdminProtegida>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <TenantProvider>
            <AdminAuthProvider>
              <BrowserRouter>
                <Roteador />
              </BrowserRouter>
            </AdminAuthProvider>
          </TenantProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
