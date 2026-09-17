import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/Common/LogoMark';

export function LandingFooter() {
  return (
    <footer className="border-t border-ink-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7 rounded-md" />
          <span>© {new Date().getFullYear()} Total Control — um produto Total Software</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hover:text-ink-200">
            Entrar
          </Link>
          <Link to="/registrar" className="hover:text-ink-200">
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  );
}
