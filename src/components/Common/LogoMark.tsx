import { useTheme } from '@/contexts/ThemeContext';

interface LogoMarkProps {
  className?: string;
}

/** Ícone da marca Total Control — troca sozinho conforme o tema (os PNGs em
 * public/ já vêm com o fundo certo pra cada um, não precisa de wrapper com
 * cor por trás). Usado nos lugares que mostram a marca do produto em si
 * (login/landing/admin) — não confundir com o logo da LOJA de cada tenant,
 * que é outra coisa (ver Sidebar.tsx, tenant.configuracoes.logoDaLojaUrl). */
export function LogoMark({ className }: LogoMarkProps) {
  const { tema } = useTheme();
  const src = tema === 'dark' ? '/total-controle-icone-app-fundo-escuro.png' : '/total-controle-icone-app-fundo-claro.png';
  return <img src={src} alt="Total Control" className={className} />;
}
