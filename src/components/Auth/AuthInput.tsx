import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconeOlho, IconeOlhoFechado } from './icones';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icone?: ReactNode;
  /** Botão de olho pra ver/ocultar o valor digitado — só faz sentido em campos type="password". */
  alternarVisibilidade?: boolean;
}

export function AuthInput({ label, icone, alternarVisibilidade, className, type, ...props }: AuthInputProps) {
  const [visivel, setVisivel] = useState(false);
  const tipoFinal = alternarVisibilidade ? (visivel ? 'text' : 'password') : type;

  return (
    <label className="block text-sm font-medium text-ink-300">
      {label}
      <div className="relative mt-1.5">
        {icone && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-500">
            {icone}
          </span>
        )}
        <input
          type={tipoFinal}
          {...props}
          className={[
            'w-full rounded-lg border border-ink-600 bg-ink-700/60 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 transition-colors focus:border-tenant focus:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-tenant/15',
            icone ? 'pl-10' : 'pl-3',
            alternarVisibilidade ? 'pr-10' : 'pr-3',
            className ?? '',
          ].join(' ')}
        />
        {alternarVisibilidade && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            tabIndex={-1}
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-500 hover:text-ink-300"
          >
            {visivel ? <IconeOlhoFechado className="h-4 w-4" /> : <IconeOlho className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
