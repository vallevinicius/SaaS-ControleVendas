import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export interface GrupoOpcoes {
  grupo: string;
  opcoes: string[];
}

interface AuthComboboxProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  grupos: GrupoOpcoes[];
  placeholder?: string;
  icone?: ReactNode;
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Campo de texto livre com lista de sugestões: dá pra digitar qualquer valor
 * ou escolher uma opção (setas + Enter também funcionam). */
export function AuthCombobox({ label, value, onChange, grupos, placeholder, icone }: AuthComboboxProps) {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(-1);
  const raiz = useRef<HTMLDivElement>(null);
  const idLista = useId();

  // Só filtra depois que a pessoa digita; ao abrir com um valor já escolhido, mostra tudo.
  const [filtrando, setFiltrando] = useState(false);
  const termo = filtrando ? normalizar(value.trim()) : '';
  const gruposVisiveis = grupos
    .map((g) => ({ ...g, opcoes: g.opcoes.filter((o) => normalizar(o).includes(termo)) }))
    .filter((g) => g.opcoes.length > 0);
  const opcoesPlanas = gruposVisiveis.flatMap((g) => g.opcoes);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function escolher(opcao: string) {
    onChange(opcao);
    setFiltrando(false);
    setAberto(false);
    setIndice(-1);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setIndice((i) => Math.min(i + 1, opcoesPlanas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && aberto && indice >= 0 && opcoesPlanas[indice]) {
      e.preventDefault();
      escolher(opcoesPlanas[indice]);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }

  let posicao = -1;

  return (
    <div ref={raiz} className="relative">
      <label className="block text-sm font-medium text-ink-300">
        {label}
        <div className="relative mt-1.5">
          {icone && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-500">{icone}</span>
          )}
          <input
            type="text"
            role="combobox"
            aria-expanded={aberto}
            aria-controls={idLista}
            aria-autocomplete="list"
            autoComplete="off"
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e.target.value);
              setFiltrando(true);
              setAberto(true);
              setIndice(-1);
            }}
            onFocus={() => setAberto(true)}
            onKeyDown={aoTeclar}
            className={[
              'w-full rounded-lg border border-ink-600 bg-ink-700/60 py-2.5 pr-9 text-sm text-ink-100 placeholder:text-ink-500 transition-colors focus:border-tenant focus:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-tenant/15',
              icone ? 'pl-10' : 'pl-3',
            ].join(' ')}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Ver opções"
            onClick={() => {
              setFiltrando(false);
              setAberto((a) => !a);
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-500 hover:text-ink-300"
          >
            <svg
              viewBox="0 0 16 16"
              className={['h-3.5 w-3.5 transition-transform', aberto ? 'rotate-180' : ''].join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>
        </div>
      </label>

      {aberto && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-ink-600 bg-ink-800 py-1 shadow-xl shadow-black/20"
        >
          {gruposVisiveis.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-400">Nenhuma sugestão, o que você digitou será usado.</li>
          )}
          {gruposVisiveis.map((g) => (
            <li key={g.grupo} role="presentation">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">{g.grupo}</p>
              <ul role="presentation">
                {g.opcoes.map((opcao) => {
                  posicao += 1;
                  const ativo = posicao === indice;
                  const selecionado = opcao === value;
                  return (
                    <li
                      key={opcao}
                      role="option"
                      aria-selected={selecionado}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        escolher(opcao);
                      }}
                      className={[
                        'flex cursor-pointer items-center justify-between px-3 py-2 text-sm',
                        ativo ? 'bg-tenant-soft text-ink-100' : 'text-ink-200 hover:bg-ink-700',
                        selecionado ? 'font-medium text-tenant' : '',
                      ].join(' ')}
                    >
                      {opcao}
                      {selecionado && <span aria-hidden>✓</span>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
