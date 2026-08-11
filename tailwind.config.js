/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cor de destaque (azul), definida só em src/index.css como "R G B"
        // — o formato rgb(var(...) / <alpha-value>) é o que permite classes
        // com opacidade (ex: bg-tenant/60) funcionarem corretamente.
        tenant: {
          DEFAULT: 'rgb(var(--tenant-primary) / <alpha-value>)',
          hover: 'rgb(var(--tenant-primary-hover) / <alpha-value>)',
          soft: 'rgb(var(--tenant-primary-soft) / 0.12)',
          foreground: 'rgb(var(--tenant-primary-foreground) / <alpha-value>)',
        },
        // Escala neutra também vinda de CSS vars, pra virar clara/escura
        // sozinha conforme o atributo data-theme em <html> — nenhum
        // componente precisa saber qual tema está ativo.
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Uma família só para todo o site (títulos e corpo) — sem mistura
        // de serifa decorativa com sans, que é a assinatura visual mais
        // reconhecível de "gerado por IA" nesse tipo de UI.
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
