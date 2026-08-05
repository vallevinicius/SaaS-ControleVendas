interface EstoqueBadgeProps {
  quantidadeEmEstoque: number;
  estoqueMinimo: number;
}

/**
 * Indicativo visual do nível de estoque de um produto, comparando a
 * quantidade atual com o mínimo configurado para aquele item.
 */
export function EstoqueBadge({ quantidadeEmEstoque, estoqueMinimo }: EstoqueBadgeProps) {
  const critico = quantidadeEmEstoque === 0;
  const baixo = !critico && quantidadeEmEstoque <= estoqueMinimo;

  if (critico) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Esgotado
      </span>
    );
  }

  if (baixo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Estoque baixo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Normal
    </span>
  );
}
