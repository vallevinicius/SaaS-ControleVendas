import type { GrupoOpcoes } from '@/components/Auth/AuthCombobox';

/** Listas usadas nos formulários de empresa (cadastro e painel admin). */
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const TIPOS_EMPRESA: GrupoOpcoes[] = [
  { grupo: 'Porte', opcoes: ['MEI (Microempreendedor Individual)', 'ME (Microempresa)', 'EPP (Empresa de Pequeno Porte)', 'Médio porte', 'Grande porte'] },
  {
    grupo: 'Natureza jurídica',
    opcoes: [
      'Empresário Individual (EI)',
      'Sociedade Limitada (LTDA)',
      'Sociedade Limitada Unipessoal (SLU)',
      'EIRELI',
      'Sociedade Anônima (S.A.)',
      'Sociedade Simples',
      'Cooperativa',
      'Associação',
      'Fundação',
    ],
  },
  { grupo: 'Regime tributário', opcoes: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Lucro Arbitrado'] },
];
