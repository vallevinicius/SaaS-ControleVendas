import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  children: ReactNode;
}

/** Checkbox customizado das telas de login/cadastro. O <input> nativo fica
 * escondido (mas continua focável e acessível) e a caixa visual reage ao
 * estado dele via "peer". */
export function AuthCheckbox({ children, ...props }: AuthCheckboxProps) {
  return (
    <label className="group flex cursor-pointer select-none items-start gap-2.5 text-sm text-ink-400 transition-colors hover:text-ink-300">
      <input type="checkbox" {...props} className="peer sr-only" />
      <span
        aria-hidden
        className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border border-ink-500 bg-ink-700/60 text-tenant-foreground transition-all duration-150 group-hover:border-tenant peer-checked:border-tenant peer-checked:bg-tenant peer-checked:shadow-sm peer-checked:shadow-tenant/30 peer-focus-visible:ring-2 peer-focus-visible:ring-tenant/40 peer-active:scale-90 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-3 w-3 scale-50 opacity-0 transition-all duration-150"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}
