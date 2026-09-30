import { mascararCep, mascararTelefone } from './mascaras';

/** Campos de empresa que as consultas públicas conseguem preencher. */
export interface DadosConsultados {
  razaoSocial?: string;
  nomeFantasia?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

/** Dados da empresa pelo CNPJ (BrasilAPI, consulta pública à Receita).
 * Devolve null se não achar ou se o serviço estiver fora do ar. */
export async function consultarCnpj(cnpj: string): Promise<DadosConsultados | null> {
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj.replace(/\D/g, '')}`);
    if (!resp.ok) return null;
    const d = await resp.json();
    return {
      razaoSocial: d.razao_social || undefined,
      nomeFantasia: d.nome_fantasia || d.razao_social || undefined,
      telefone: d.ddd_telefone_1 ? mascararTelefone(String(d.ddd_telefone_1)) : undefined,
      email: d.email ? String(d.email).toLowerCase() : undefined,
      cep: d.cep ? mascararCep(String(d.cep)) : undefined,
      logradouro: d.logradouro ? [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ') : undefined,
      numero: d.numero ? String(d.numero) : undefined,
      complemento: d.complemento || undefined,
      bairro: d.bairro || undefined,
      cidade: d.municipio || undefined,
      uf: d.uf || undefined,
    };
  } catch {
    return null;
  }
}

/** Endereço pelo CEP (ViaCEP). Null se não achar ou serviço fora do ar. */
export async function consultarCep(cep: string): Promise<Pick<DadosConsultados, 'logradouro' | 'bairro' | 'cidade' | 'uf'> | null> {
  const digitos = cep.replace(/\D/g, '');
  if (digitos.length !== 8) return null;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    const d = await resp.json();
    if (d.erro) return null;
    return { logradouro: d.logradouro || undefined, bairro: d.bairro || undefined, cidade: d.localidade || undefined, uf: d.uf || undefined };
  } catch {
    return null;
  }
}

/** Fusos horários brasileiros mais comuns, pra escolha na edição da loja. */
export const FUSOS_BRASIL: Array<{ valor: string; rotulo: string }> = [
  { valor: 'America/Sao_Paulo', rotulo: 'Brasília (GMT-3)' },
  { valor: 'America/Manaus', rotulo: 'Amazonas (GMT-4)' },
  { valor: 'America/Cuiaba', rotulo: 'Mato Grosso (GMT-4)' },
  { valor: 'America/Campo_Grande', rotulo: 'Mato Grosso do Sul (GMT-4)' },
  { valor: 'America/Rio_Branco', rotulo: 'Acre (GMT-5)' },
  { valor: 'America/Noronha', rotulo: 'Fernando de Noronha (GMT-2)' },
];
