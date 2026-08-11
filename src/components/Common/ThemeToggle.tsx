import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { tema, alternarTema } = useTheme();
  const ehEscuro = tema === 'dark';

  return (
    <button
      onClick={alternarTema}
      aria-label={ehEscuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={ehEscuro ? 'Modo claro' : 'Modo escuro'}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
    >
      <span aria-hidden className="text-base leading-none">
        {ehEscuro ? '☀' : '☾'}
      </span>
    </button>
  );
}
