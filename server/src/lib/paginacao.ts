const TAMANHO_PAGINA_PADRAO = 20;
const TAMANHO_PAGINA_MAXIMO = 100;

/** Lê `pagina`/`tamanho` da query string com defaults e limites sãos —
 * usado por toda rota de listagem que pagina resultado (ver produtos.routes.ts,
 * clientes.routes.ts). */
export function lerPaginacao(query: Record<string, unknown>): { pagina: number; tamanho: number } {
  const pagina = Math.max(1, Math.trunc(Number(query.pagina)) || 1);
  const tamanho = Math.min(
    TAMANHO_PAGINA_MAXIMO,
    Math.max(1, Math.trunc(Number(query.tamanho)) || TAMANHO_PAGINA_PADRAO),
  );
  return { pagina, tamanho };
}

export interface PaginaResultado<T> {
  itens: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export function montarResposta<T>(itens: T[], total: number, pagina: number, tamanho: number): PaginaResultado<T> {
  return { itens, total, pagina, totalPaginas: Math.max(1, Math.ceil(total / tamanho)) };
}
