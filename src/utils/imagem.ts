/** Redimensiona uma imagem escolhida pelo usuário (input file) pra caber em
 * `maxDimensao` px no maior lado e devolve um data URL (base64) — usado pra
 * enviar a logo da loja sem precisar de um serviço externo de storage. PNG
 * preserva transparência (comum em logo), então mantemos esse formato. */
export function redimensionarImagem(arquivo: File, maxDimensao = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não consegui ler o arquivo.'));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
      imagem.onload = () => {
        const escala = Math.min(1, maxDimensao / Math.max(imagem.width, imagem.height));
        const largura = Math.round(imagem.width * escala);
        const altura = Math.round(imagem.height * escala);

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Não consegui processar a imagem.'));
        ctx.drawImage(imagem, 0, 0, largura, altura);
        resolve(canvas.toDataURL('image/png'));
      };
      imagem.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}
