import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { linkWhatsapp } from '@/utils/contato';

const PERGUNTAS = [
  {
    pergunta: 'Preciso instalar alguma coisa?',
    resposta: 'Não. O Total Control roda no navegador, então basta criar a conta e entrar de qualquer computador.',
  },
  {
    pergunta: 'Como funciona o teste grátis?',
    resposta:
      'Você usa o plano Starter por 14 dias, sem informar cartão de crédito. Ao fim do período, o acesso fica pausado até você escolher um plano.',
  },
  {
    pergunta: 'Posso trazer meus produtos de uma planilha?',
    resposta: 'Sim. Você importa os produtos por um arquivo CSV ou cadastra um por um, como preferir.',
  },
  {
    pergunta: 'Meus funcionários veem tudo?',
    resposta:
      'Não. Cada funcionário tem o próprio login e só enxerga as telas que você liberar, por exemplo só o PDV para quem opera o caixa.',
  },
  {
    pergunta: 'Tenho mais de uma loja. Dá pra controlar todas?',
    resposta:
      'No plano Enterprise, sim. Você usa um único login, troca de loja com um clique e ainda vê o faturamento consolidado. Os dados de cada loja ficam separados.',
  },
  {
    pergunta: 'O sistema emite nota fiscal?',
    resposta:
      'Ainda não. Hoje o Total Control cuida de PDV, estoque, financeiro e relatórios. Se a emissão de nota é essencial pra você, fale com a gente.',
  },
  {
    pergunta: 'Posso trocar de plano depois?',
    resposta: 'Pode. Se sua loja crescer e você precisar de mais usuários, produtos ou lojas, é só chamar a gente.',
  },
];

export function LandingFAQ() {
  // Uma pergunta aberta por vez; clicar na aberta fecha.
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <section id="faq" className="border-t border-ink-800 bg-ink-800/40 py-20">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 px-3 py-1 text-xs font-medium text-tenant">
            Perguntas frequentes
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-100">Ficou com alguma dúvida?</h2>
        </div>

        <div className="mt-10 space-y-3">
          {PERGUNTAS.map(({ pergunta, resposta }, i) => {
            const aberto = aberta === i;
            return (
              <div
                key={pergunta}
                className={[
                  'rounded-xl border bg-ink-800 transition-colors',
                  aberto ? 'border-tenant/40' : 'border-ink-700 hover:border-ink-600',
                ].join(' ')}
              >
                <button
                  type="button"
                  id={`faq-pergunta-${i}`}
                  aria-expanded={aberto}
                  aria-controls={`faq-resposta-${i}`}
                  onClick={() => setAberta(aberto ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink-100"
                >
                  {pergunta}
                  <span
                    aria-hidden
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      aberto ? 'rotate-45 bg-tenant text-tenant-foreground' : 'bg-tenant-soft text-tenant',
                    ].join(' ')}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div
                      id={`faq-resposta-${i}`}
                      role="region"
                      aria-labelledby={`faq-pergunta-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={{ y: -8 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="px-5 pb-5 text-sm leading-relaxed text-ink-400"
                      >
                        {resposta}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-ink-400">
          Não achou o que procurava?{' '}
          <a
            href={linkWhatsapp('Olá! Tenho uma dúvida sobre o Total Control.')}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-tenant hover:underline"
          >
            Fale com a gente no WhatsApp
          </a>
          .
        </p>
      </div>
    </section>
  );
}
