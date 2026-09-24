const NUMERO_WHATSAPP = '5522999447646';

/** Link do WhatsApp Business da Total Software, usado nos pontos de contato
 * "fale com a gente" da home page e da área do cliente. */
export function linkWhatsapp(mensagem: string): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}
