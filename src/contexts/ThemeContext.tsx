import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * ThemeContext
 * ----------------------------------------------------------------------------
 * Modo claro/escuro do app. Não depende de nenhum dado de tenant — é só uma
 * preferência local do navegador, salva em localStorage. Aplica o tema via
 * atributo `data-theme` em <html>; toda a paleta (ink-*, tenant-*) é CSS var
 * definida em src/index.css, então nenhum componente precisa saber o tema
 * atual pra se adaptar.
 * ----------------------------------------------------------------------------
 */

type Tema = 'dark' | 'light';

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const CHAVE_TEMA = 'total_control_tema';

function lerTemaSalvo(): Tema {
  const salvo = localStorage.getItem(CHAVE_TEMA);
  return salvo === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(CHAVE_TEMA, tema);
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme precisa ser usado dentro de um <ThemeProvider>.');
  }
  return context;
}
