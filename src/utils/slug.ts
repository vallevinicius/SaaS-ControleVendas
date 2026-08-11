/**
 * Deriva um "domínio" curto a partir do nome da loja, usado para sugerir
 * automaticamente a parte depois do "@" ao criar um login (ex: "Cabo Frio
 * Outlet" → "cabofriooutlet"). Não é um domínio de e-mail real — só um
 * identificador legível para logins internos do sistema.
 */
export function slugificarNomeLoja(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return base || 'loja';
}
