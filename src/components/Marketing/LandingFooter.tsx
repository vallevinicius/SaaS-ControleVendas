import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/Common/LogoMark';
import { linkWhatsapp } from '@/utils/contato';

export function LandingFooter() {
  return (
    <footer className="border-t border-ink-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7 rounded-md" />
          <span>© {new Date().getFullYear()} Total Control. Um produto Total Software</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/termos" className="hover:text-ink-200">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="hover:text-ink-200">
            Privacidade
          </Link>
          <a
            href={linkWhatsapp('Olá! Gostaria de falar com a equipe do Total Control.')}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink-200"
          >
            WhatsApp
          </a>
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
