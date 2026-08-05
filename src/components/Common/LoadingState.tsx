export function LoadingState({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-24 text-ink-400">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-tenant"
        role="status"
        aria-label={mensagem}
      />
      <span className="text-sm">{mensagem}</span>
    </div>
  );
}
