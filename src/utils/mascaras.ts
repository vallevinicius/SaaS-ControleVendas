/** Formata progressivamente enquanto o usuário digita: 00.000.000/0000-00 */
export function mascararCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

/** Formata progressivamente enquanto o usuário digita: (00) 00000-0000 (ou
 * (00) 0000-0000 pra fixo, dependendo da quantidade de dígitos). */
export function mascararTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 0) return `(${d}`;
  return d;
}

/** Formata progressivamente enquanto o usuário digita: 000.000.000-00 */
export function mascararCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** Formata progressivamente enquanto o usuário digita: 00000-000 */
export function mascararCep(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function digitosIguais(d: string): boolean {
  return /^(\d)\1+$/.test(d);
}

/** Confere os dígitos verificadores do CNPJ (aceita com ou sem máscara). */
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

/** Confere os dígitos verificadores do CPF (aceita com ou sem máscara). */
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
