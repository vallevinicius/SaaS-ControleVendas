import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminToken, limparTokenAdmin } from '@/services/apiService';
import { LogoMark } from '@/components/Common/LogoMark';

const URL_TOTAL_CONTROL = import.meta.env.VITE_TOTALSOFTWAREADMIN_URL ?? 'http://localhost:3010/totalcontrol';

/** Destino de quem loga com credenciais de admin da plataforma pela mesma
 * tela de login da loja (ver LoginScreen.tsx). A gestão de empresas/lojas em
 * si acontece no TotalControl (totalSoftwareAdmin) — aqui é só a ponte. */
export function AdminScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAdminToken()) navigate('/login', { replace: true });
  }, [navigate]);

  function handleSair() {
    limparTokenAdmin();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-ink-900 px-4 text-center">
      <LogoMark className="h-11 w-11 rounded-xl" />
      <div>
        <p className="font-display text-xl font-semibold text-ink-100">
          Você entrou como administrador da Total Software
        </p>
        <p className="mt-2 max-w-md text-sm text-ink-400">
          A gestão de empresas e lojas do Total Control agora é feita pelo painel interno
          (TotalControl).
        </p>
      </div>
      <a
        href={URL_TOTAL_CONTROL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-tenant px-6 py-3 text-sm font-semibold text-tenant-foreground hover:opacity-90"
      >
        Abrir o TotalControl
      </a>
      <button onClick={handleSair} className="text-sm text-ink-400 hover:text-ink-200">
        Sair
      </button>
    </div>
  );
}
