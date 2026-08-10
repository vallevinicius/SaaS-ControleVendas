import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { LoadingState } from '@/components/Common/LoadingState';
import { DashboardScreen } from '@/components/Dashboard/DashboardScreen';
import { PDVScreen } from '@/components/PDV/PDVScreen';
import { EstoqueScreen } from '@/components/Estoque/EstoqueScreen';
import { ClientesScreen } from '@/components/Clientes/ClientesScreen';
import { RelatoriosScreen } from '@/components/Relatorios/RelatoriosScreen';
import { FinanceiroScreen } from '@/components/Financeiro/FinanceiroScreen';
import { LoginScreen } from '@/components/Auth/LoginScreen';
import { RegisterScreen } from '@/components/Auth/RegisterScreen';
import { AdminLoginScreen } from '@/components/Admin/AdminLoginScreen';
import { AdminDashboard } from '@/components/Admin/AdminDashboard';

function TelaCarregando() {
  return (
    <div className="flex h-screen items-center justify-center bg-ink-900">
      <LoadingState mensagem="Carregando sessão…" />
    </div>
  );
}

/** Rotas da loja (tenant) — sessão resolvida via TenantContext. */
function RotaProtegida({ children }: { children: ReactNode }) {
  const { autenticado, carregando } = useTenant();
  if (carregando) return <TelaCarregando />;
  if (!autenticado) return <Navigate to="/login" replace />;
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
          <RotaProtegida>
            <DashboardScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/pdv"
        element={
          <RotaProtegida>
            <PDVScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/estoque"
        element={
          <RotaProtegida>
            <EstoqueScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/financeiro"
        element={
          <RotaProtegida>
            <FinanceiroScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/clientes"
        element={
          <RotaProtegida>
            <ClientesScreen />
          </RotaProtegida>
        }
      />
      <Route
        path="/relatorios"
        element={
          <RotaProtegida>
            <RelatoriosScreen />
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
  );
}
