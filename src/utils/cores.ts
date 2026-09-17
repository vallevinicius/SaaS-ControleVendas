/** Converte "#RRGGBB" pro formato "R G B" (espaços, sem vírgula/função) que
 * as variáveis CSS de cor deste projeto usam (ver src/index.css) — é o
 * formato que permite ao Tailwind aplicar opacidade (bg-tenant/60). */
export function hexParaRgb(hex: string): string | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const inteiro = parseInt(match[1], 16);
  const r = (inteiro >> 16) & 255;
  const g = (inteiro >> 8) & 255;
  const b = inteiro & 255;
  return `${r} ${g} ${b}`;
}

/** Clareia um hex em `quantidade` (0-1) na direção do branco — usado pra
 * derivar automaticamente a cor de hover a partir da cor principal, sem
 * precisar pedir uma segunda cor pro usuário escolher. */
export function clarearHex(hex: string, quantidade = 0.2): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return hex;
  const inteiro = parseInt(match[1], 16);
  const canal = (deslocamento: number) => {
    const valor = (inteiro >> deslocamento) & 255;
    return Math.round(valor + (255 - valor) * quantidade);
  };
  const paraHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${paraHex(canal(16))}${paraHex(canal(8))}${paraHex(canal(0))}`;
}
