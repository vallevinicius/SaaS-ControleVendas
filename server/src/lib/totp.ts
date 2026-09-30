import crypto from 'node:crypto';

/** TOTP (RFC 6238) sem dependência externa: o mesmo código de 6 dígitos que o
 * Google Authenticator, Authy e 1Password geram a cada 30 segundos. */

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Codificar(bytes: Buffer): string {
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let saida = '';
  for (let i = 0; i < bits.length; i += 5) saida += ALFABETO[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return saida;
}

function base32Decodificar(texto: string): Buffer {
  let bits = '';
  for (const c of texto.replace(/=+$/, '').toUpperCase()) {
    const v = ALFABETO.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function gerarSegredoTotp(): string {
  return base32Codificar(crypto.randomBytes(20));
}

function codigoDoPasso(segredo: string, passo: number): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const h = crypto.createHmac('sha1', base32Decodificar(segredo)).update(contador).digest();
  const offset = h[h.length - 1] & 0x0f;
  const numero = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(numero % 1_000_000).padStart(6, '0');
}

const passoAtual = () => Math.floor(Date.now() / 30_000);

/** Confere o código aceitando 1 passo pra cada lado (relógio do celular um pouco
 * fora). Devolve o passo que bateu, ou null. O chamador guarda o passo usado
 * pra recusar o mesmo código duas vezes. */
export function verificarTotp(segredo: string, codigo: string): number | null {
  const limpo = codigo.replace(/\s/g, '');
  if (!/^\d{6}$/.test(limpo)) return null;
  const agora = passoAtual();
  for (const passo of [agora, agora - 1, agora + 1]) {
    const esperado = Buffer.from(codigoDoPasso(segredo, passo));
    if (crypto.timingSafeEqual(esperado, Buffer.from(limpo))) return passo;
  }
  return null;
}

export function urlOtpauth(segredo: string, conta: string): string {
  const emissor = 'Total Control (admin)';
  return `otpauth://totp/${encodeURIComponent(emissor)}:${encodeURIComponent(conta)}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=6&period=30`;
}

/** Código vigente agora (usado em testes). */
export const codigoAtual = (segredo: string) => codigoDoPasso(segredo, passoAtual());
