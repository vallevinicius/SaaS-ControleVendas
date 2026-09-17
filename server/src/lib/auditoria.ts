import { prisma } from './prisma.js';

/** Registra uma ação sensível na trilha de auditoria da loja (ver
 * `RegistroAuditoria` no schema e `auditoria.routes.ts`). Nunca lança — uma
 * falha ao registrar não pode derrubar a ação de verdade que estava
 * acontecendo, só é logada no console pra investigar depois. */
export async function registrarAuditoria(
  tenantId: string,
  usuarioId: string,
  acao: string,
  detalhe?: string,
): Promise<void> {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nome: true } });
    await prisma.registroAuditoria.create({
      data: { tenantId, usuarioId, usuarioNome: usuario?.nome ?? 'Desconhecido', acao, detalhe },
    });
  } catch (erro) {
    console.error('Falha ao registrar auditoria:', erro);
  }
}
