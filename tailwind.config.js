/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cor de destaque controlada dinamicamente via variável CSS
        // injetada pelo TenantContext (--tenant-primary). Nunca hardcode
        // uma cor de marca fixa: cada tenant define a sua.
        tenant: {
          DEFAULT: 'var(--tenant-primary)',
          hover: 'var(--tenant-primary-hover)',
          soft: 'var(--tenant-primary-soft)',
        },
        ink: {
          900: '#12141C',
          800: '#1B1E29',
          700: '#262A38',
          600: '#3A3F52',
          400: '#6B7186',
          200: '#C7CAD6',
          100: '#EDEEF2',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
