import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesCore } from '@/components/ui/sparkles';
import { ThemeToggle } from '@/components/Common/ThemeToggle';
import { LogoMark } from '@/components/Common/LogoMark';
import { IconeSuporte } from './icones';

interface AuthLayoutProps {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}

export function AuthLayout({ titulo, subtitulo, children, rodape }: AuthLayoutProps) {
  const reduzirMovimento = useReducedMotion();

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-ink-900 px-4 py-10">
      {/* Partículas de fundo, as mesmas da landing page. */}
      {!reduzirMovimento && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <SparklesCore background="transparent" minSize={0.4} maxSize={1.1} particleDensity={45} speed={0.6} particleColor="#10B981" className="h-full w-full" />
        </div>
      )}

      {/* Glows decorativos, flutuando devagar. */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-tenant/15 blur-3xl"
        style={{ animation: 'auth-flutuar 12s ease-in-out infinite' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-tenant/15 blur-3xl"
        style={{ animation: 'auth-flutuar 15s ease-in-out infinite reverse' }}
        aria-hidden
      />

      <motion.div
        className="absolute left-5 top-5"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/80 px-3.5 py-2 text-sm font-medium text-ink-300 backdrop-blur transition-colors hover:border-tenant/50 hover:text-ink-100"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3 5 8l5 5" />
          </svg>
          Voltar
        </Link>
      </motion.div>

      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Halo atrás do card, dá profundidade sem pesar. */}
        <div className="absolute -inset-3 rounded-3xl bg-tenant/10 blur-2xl" aria-hidden />

        <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-2xl shadow-tenant/10">
          <div className="relative flex items-center justify-center gap-2.5 overflow-hidden bg-gradient-to-br from-tenant to-tenant-hover px-6 py-5">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/25 blur-md"
              style={{ animation: 'auth-brilho 1.4s 0.5s ease-out both' }}
              aria-hidden
            />
            <motion.span
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
              className="relative flex"
            >
              <LogoMark className="h-9 w-9 rounded-lg" />
            </motion.span>
            <span className="relative font-display text-lg font-semibold text-tenant-foreground">Total Control</span>
          </div>

          <div className="auth-campos p-7">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-tenant">
              Gestão de vendas e estoque
            </p>
            <p className="mt-2 text-center font-display text-xl font-semibold text-ink-100">{titulo}</p>
            <p className="mt-1 text-center text-sm text-ink-400">{subtitulo}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-ink-700 px-6 py-4 text-xs text-ink-500">
            <IconeSuporte className="h-4 w-4 shrink-0" />
            Problemas de acesso? Fale com o suporte.
          </div>
        </div>

        {rodape && (
          <motion.div
            className="relative mt-6 text-center text-sm text-ink-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            {rodape}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
