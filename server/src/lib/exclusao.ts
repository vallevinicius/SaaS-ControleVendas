import { prisma } from './prisma.js';

/** Operações de exclusão definitiva (LGPD) compartilhadas entre o dono da
 * empresa (lojas.routes.ts) e o painel da Total Software (admin.routes.ts).
 * A ordem é explícita, do que depende de algo para o que é dependência: os
 * registros com FK sem cascade (vendas, caixas, lançamentos) saem antes dos
 * usuários, produtos e categorias que eles referenciam. */
export function operacoesExcluirLojas(tenantIds: string[]) {
  const noTenant = { tenantId: { in: tenantIds } };
  return [
    prisma.itemTransacao.deleteMany({ where: { transacao: noTenant } }),
    prisma.transacao.deleteMany({ where: noTenant }),
    prisma.caixa.deleteMany({ where: noTenant }),
    prisma.lancamentoFinanceiro.deleteMany({ where: noTenant }),
    prisma.produto.deleteMany({ where: noTenant }),
    prisma.categoria.deleteMany({ where: noTenant }),
    prisma.cliente.deleteMany({ where: noTenant }),
    prisma.vendedor.deleteMany({ where: noTenant }),
    prisma.registroAuditoria.deleteMany({ where: noTenant }),
    prisma.acessoLoja.deleteMany({
      where: { OR: [noTenant, { usuario: { tenantId: { in: tenantIds } } }] },
    }),
    prisma.usuario.deleteMany({ where: noTenant }),
    prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } }),
  ];
}

/** Usuários das lojas que serão apagadas e que têm movimentações em OUTRA
 * loja (por terem recebido acesso extra): o banco não deixa apagá-los sem
 * quebrar o histórico de lá. Devolve o nome do primeiro encontrado, ou null. */
export async function usuarioComHistoricoEmOutraLoja(tenantIds: string[]): Promise<string | null> {
  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: { in: tenantIds } },
    select: { id: true, nome: true },
  });
  if (usuarios.length === 0) return null;
  const ids = usuarios.map((u) => u.id);
  const fora = { tenantId: { notIn: tenantIds } };

  const [venda, lancamento, caixaAberto, caixaFechado] = await Promise.all([
    prisma.transacao.findFirst({ where: { usuarioId: { in: ids }, ...fora }, select: { usuarioId: true } }),
    prisma.lancamentoFinanceiro.findFirst({ where: { usuarioId: { in: ids }, ...fora }, select: { usuarioId: true } }),
    prisma.caixa.findFirst({ where: { abertoPorId: { in: ids }, ...fora }, select: { abertoPorId: true } }),
    prisma.caixa.findFirst({ where: { fechadoPorId: { in: ids }, ...fora }, select: { fechadoPorId: true } }),
  ]);
  const id = venda?.usuarioId ?? lancamento?.usuarioId ?? caixaAberto?.abertoPorId ?? caixaFechado?.fechadoPorId;
  return id ? (usuarios.find((u) => u.id === id)?.nome ?? 'Um usuário') : null;
}
