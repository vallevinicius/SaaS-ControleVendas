import type { SVGProps } from 'react';

/** Ícones de linha simples (traço), sem depender de nenhuma lib de ícones —
 * usados só pra decorar os campos das telas de login/cadastro. */
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

export function IconeEmail(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Base>
  );
}

export function IconeSenha(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

export function IconeLoja(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 9 12 3l9 6" />
      <path d="M5 9v10h14V9" />
      <path d="M9 19v-6h6v6" />
    </Base>
  );
}

export function IconeId(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="12" r="2" />
      <path d="M13 10h5M13 14h5" />
    </Base>
  );
}

export function IconeTelefone(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 18h4" />
    </Base>
  );
}

export function IconeUsuario(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </Base>
  );
}

export function IconeOlho(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  );
}

export function IconeOlhoFechado(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 3l18 18" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M6.6 6.7C4 8.4 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.6-.6M10.6 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.2" />
    </Base>
  );
}

export function IconeSuporte(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2" y="13" width="5" height="7" rx="2" />
      <rect x="17" y="13" width="5" height="7" rx="2" />
    </Base>
  );
}
