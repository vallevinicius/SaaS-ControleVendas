/** Validação e formatação de documentos brasileiros (mesma lógica do front,
 * em src/utils/mascaras.ts — o servidor não pode confiar só na validação do
 * navegador). */

function digitosIguais(d: string): boolean {
  return /^(\d)\1+$/.test(d);
}

export function cnpjValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 14 || digitosIguais(d)) return false;
  const calc = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const n of base) {
      soma += Number(n) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(d.slice(0, 12)) === Number(d[12]) && calc(d.slice(0, 13)) === Number(d[13]);
}

export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '');
  if (d.length !== 11 || digitosIguais(d)) return false;
  const calc = (base: string) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(d.slice(0, 9)) === Number(d[9]) && calc(d.slice(0, 10)) === Number(d[10]);
}

/** Devolve o CNPJ no formato 00.000.000/0000-00 (o mesmo que o front grava),
 * ou null se for inválido. Normalizar antes de salvar garante que o mesmo
 * CNPJ digitado com ou sem máscara não escape da checagem de duplicidade. */
export function normalizarCnpj(valor: string): string | null {
  if (!cnpjValido(valor)) return null;
  const d = valor.replace(/\D/g, '');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
