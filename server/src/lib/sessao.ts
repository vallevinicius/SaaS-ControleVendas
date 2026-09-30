import crypto from 'node:crypto';
import type { Request } from 'express';
import { prisma } from './prisma.js';
import { assinarToken } from '../middleware/auth.js';

/** Quanto tempo a pessoa fica logada sem digitar a senha de novo. */
const VALIDADE_REFRESH_DIAS = 30;

const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

interface UsuarioDaSessao {
  id: string;
  tenantId: string;
  papel: 'ADMIN' | 'GERENTE' | 'OPERADOR_CAIXA';
  tokenVersion: number;
}

/** Emite o par de tokens: o de acesso (curto, vai em cada requisição) e o de
 * renovação (longo, só é enviado pra /auth/refresh). O de renovação é guardado
 * apenas como hash, então um vazamento do banco não entrega sessões. */
export async function emitirSessao(u: UsuarioDaSessao, req: Request, tenantId = u.tenantId) {
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  await prisma.sessaoRefresh.create({
    data: {
      usuarioId: u.id,
      tokenHash: hash(refreshToken),
      expiraEm: new Date(Date.now() + VALIDADE_REFRESH_DIAS * 86_400_000),
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 255),
    },
  });
  return { token: assinarToken({ id: u.id, tenantId, papel: u.papel, tv: u.tokenVersion }), refreshToken };
}

export type ResultadoRenovacao = { ok: true; token: string; refreshToken: string } | { ok: false };

/** Troca um token de renovação por um par novo (o antigo fica inutilizado).
 * Se um token JÁ USADO aparece de novo, alguém o copiou: todas as sessões da
 * pessoa são derrubadas. `tenantIdPedido` mantém a loja em que ela estava, desde
 * que continue tendo acesso a ela. */
export async function renovarSessao(
  refreshToken: string,
  req: Request,
  tenantIdPedido: string | undefined,
  temAcessoALoja: (usuarioId: string, tenantIdOrigem: string, tenantId: string) => Promise<boolean>,
): Promise<ResultadoRenovacao> {
  const sessao = await prisma.sessaoRefresh.findUnique({
    where: { tokenHash: hash(refreshToken) },
    include: { usuario: { include: { tenant: { include: { empresa: true } } } } },
  });
  if (!sessao) return { ok: false };

  if (sessao.revogadaEm) {
    await revogarTodasAsSessoes(sessao.usuarioId);
    return { ok: false };
  }
  const u = sessao.usuario;
  if (sessao.expiraEm < new Date() || !u.ativo || !u.tenant.ativo || !u.tenant.empresa.ativo) return { ok: false };

  // Consome o token (condicional: duas renovações simultâneas com o mesmo token
  // não passam as duas).
  const consumida = await prisma.sessaoRefresh.updateMany({
    where: { id: sessao.id, revogadaEm: null },
    data: { revogadaEm: new Date() },
  });
  if (consumida.count === 0) return { ok: false };

  const tenantId =
    tenantIdPedido && tenantIdPedido !== u.tenantId && (await temAcessoALoja(u.id, u.tenantId, tenantIdPedido))
      ? tenantIdPedido
      : u.tenantId;

  const nova = await emitirSessao(u, req, tenantId);
  return { ok: true, ...nova };
}

export async function revogarSessao(refreshToken: string): Promise<void> {
  await prisma.sessaoRefresh.updateMany({
    where: { tokenHash: hash(refreshToken), revogadaEm: null },
    data: { revogadaEm: new Date() },
  });
}

/** Derruba todas as sessões da pessoa: os tokens de acesso em circulação deixam
 * de valer na próxima requisição (versão mudou) e as renovações são apagadas. */
export async function revogarTodasAsSessoes(usuarioId: string): Promise<void> {
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: usuarioId }, data: { tokenVersion: { increment: 1 } } }),
    prisma.sessaoRefresh.deleteMany({ where: { usuarioId } }),
  ]);
}

/** Limpeza periódica de renovações vencidas ou já usadas há mais de 7 dias. */
export async function limparSessoesAntigas(): Promise<void> {
  await prisma.sessaoRefresh.deleteMany({
    where: { OR: [{ expiraEm: { lt: new Date() } }, { revogadaEm: { lt: new Date(Date.now() - 7 * 86_400_000) } }] },
  });
}
