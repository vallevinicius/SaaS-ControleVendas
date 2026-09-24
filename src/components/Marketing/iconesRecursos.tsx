import type { SVGProps } from 'react';

/** Ícones de linha (mesmo estilo dos usados no login) pra substituir os
 * glifos unicode dos cards de recursos da landing — ficam nítidos em
 * qualquer navegador/SO, ao contrário de caracteres como "⛁"/"▤". */
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

export function IconeCarrinho(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
    </Base>
  );
}

export function IconeCaixa(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 8l9-5 9 5-9 5-9-5Z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </Base>
  );
}

export function IconeCarteira(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconeGrafico(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M4 20h16" />
    </Base>
  );
}

export function IconeComissao(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 14.5l5-5" />
      <circle cx="9.7" cy="9.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="14.3" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconeClientes(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.3" cy="9" r="2.2" />
      <path d="M15.6 14.2c2.5.5 4.1 2.4 4.1 5.6" />
    </Base>
  );
}

export function IconeEscudo(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  );
}

export function IconeCamadas(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </Base>
  );
}
