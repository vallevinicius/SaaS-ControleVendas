/** Parser de CSV simples (sem lib nova): detecta `;` ou `,` como separador
 * pelo cabeçalho, não lida com aspas/campos com o separador dentro — cobre
 * bem o caso de planilha exportada do Excel/Google Sheets pra importação de
 * produtos (ver ImportarProdutosModal). Cada linha vira um objeto chaveado
 * pelo cabeçalho (em minúsculo, sem espaço nas pontas). */
export function parseCsv(texto: string): Array<Record<string, string>> {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (linhas.length < 2) return [];

  const separador = linhas[0].includes(';') ? ';' : ',';
  const cabecalho = linhas[0].split(separador).map((c) => c.trim().toLowerCase());

  return linhas.slice(1).map((linha) => {
    const valores = linha.split(separador);
    const objeto: Record<string, string> = {};
    cabecalho.forEach((chave, i) => {
      objeto[chave] = (valores[i] ?? '').trim();
    });
    return objeto;
  });
}

/** Monta um CSV simples (separado por ;, padrão que o Excel em pt-BR espera)
 * e dispara o download no navegador — sem nenhuma lib nova. */
export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]): void {
  function escapar(valor: string | number): string {
    const texto = String(valor);
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  }

  const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\n');
  // BOM no início pro Excel reconhecer UTF-8 (senão acento vira caractere estranho).
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
