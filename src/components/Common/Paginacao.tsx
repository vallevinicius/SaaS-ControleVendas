interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  aoMudarPagina: (pagina: number) => void;
}

/** Controles de "Anterior/Próxima" usados nas listas paginadas (Estoque,
 * Clientes). Some sozinho quando cabe tudo numa página só. */
export function Paginacao({ pagina, totalPaginas, total, aoMudarPagina }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-400">
      <p>
        {total} registro(s) · página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => aoMudarPagina(pagina - 1)}
          disabled={pagina <= 1}
          className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-tenant hover:text-tenant disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          onClick={() => aoMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-tenant hover:text-tenant disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
