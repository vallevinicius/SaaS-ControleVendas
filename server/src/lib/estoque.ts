import { prisma } from './prisma.js';

/** Conta produtos ativos com estoque no nível mínimo ou abaixo. Só busca as
 * duas colunas necessárias pra comparação (Prisma não compara colunas entre
 * si na query, então o filtro final é em memória — mas bem mais leve que
 * carregar a linha inteira de cada produto). */
export async function contarProdutosComEstoqueBaixo(tenantId: string): Promise<number> {
  const produtos = await prisma.produto.findMany({
    where: { tenantId, ativo: true },
    select: { quantidadeEmEstoque: true, estoqueMinimo: true },
  });
  return produtos.filter((p) => p.quantidadeEmEstoque <= p.estoqueMinimo).length;
}
