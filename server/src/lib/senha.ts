import { z } from 'zod';

/** Política de senha: 8+ caracteres, com letra e número. Vale para novas senhas
 * (cadastro, novo usuário, reset); quem já tem senha antiga continua entrando. */
export const senhaForte = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter pelo menos uma letra.')
  .regex(/\d/, 'A senha precisa ter pelo menos um número.');

/** Versão vigente dos Termos de Uso e da Política de Privacidade (gravada no aceite). */
export const VERSAO_TERMOS = '2026-09';

/** Mensagem pra mostrar à pessoa quando a validação falha: a primeira explicação
 * escrita à mão (ex: regra da senha), ou o texto genérico. */
export function mensagemDeValidacao(erro: z.ZodError, padrao = 'Dados inválidos.'): string {
  return erro.issues.find((i) => i.message && !/^(Required|Invalid|Expected|String must|Number must)/.test(i.message))?.message ?? padrao;
}
