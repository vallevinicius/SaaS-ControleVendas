import type { TelaComPermissao, Usuario } from '@/types';

/** Telas que podem ter acesso concedido/negado por usuário (fora "Usuários",
 * que é sempre restrito a ADMIN). Usado tanto nos checkboxes de criação/edição
 * de login quanto para filtrar a Sidebar e proteger as rotas. */
export const TELAS_COM_PERMISSAO: Array<{ chave: TelaComPermissao; rota: string; rotulo: string }> = [
  { chave: 'dashboard', rota: '/', rotulo: 'Dashboard' },
  { chave: 'pdv', rota: '/pdv', rotulo: 'Caixa' },
  { chave: 'estoque', rota: '/estoque', rotulo: 'Estoque' },
  { chave: 'financeiro', rota: '/financeiro', rotulo: 'Financeiro' },
  { chave: 'clientes', rota: '/clientes', rotulo: 'Clientes' },
  { chave: 'vendedores', rota: '/vendedores', rotulo: 'Vendedores' },
  { chave: 'relatorios', rota: '/relatorios', rotulo: 'Relatórios' },
];

/** Conjunto padrão de telas sugerido ao escolher cada papel — só um ponto de
 * partida, o admin pode ajustar os checkboxes livremente antes de salvar. */
export const PERMISSOES_PADRAO_POR_PAPEL: Record<string, TelaComPermissao[]> = {
  ADMIN: TELAS_COM_PERMISSAO.map((t) => t.chave),
  GERENTE: ['dashboard', 'pdv', 'estoque', 'clientes', 'relatorios'],
  OPERADOR_CAIXA: ['dashboard', 'pdv'],
};

/** ADMIN sempre tem acesso total; contas sem `permissoes` definido (contas
 * criadas antes desse recurso existir) também — por compatibilidade.
 * Exceção: "vendedores" é restrito só à conta principal da loja (raiz),
 * mesmo pra outros logins ADMIN — não é uma permissão concedível. */
export function podeVerTela(
  usuario: Pick<Usuario, 'papel' | 'permissoes' | 'raiz'> | null,
  tela: TelaComPermissao,
): boolean {
  if (!usuario) return false;
  if (tela === 'vendedores') return usuario.raiz === true;
  if (usuario.papel === 'ADMIN') return true;
  if (!usuario.permissoes) return true;
  return usuario.permissoes.includes(tela);
}
