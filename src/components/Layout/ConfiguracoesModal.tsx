import { useRef, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { atualizarAparencia } from '@/services/apiService';
import { redimensionarImagem } from '@/utils/imagem';

interface ConfiguracoesModalProps {
  aoFechar: () => void;
}

function logoIniciaisPadrao(nomeFantasia: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`;
}

const TAMANHO_MAXIMO_ARQUIVO = 8 * 1024 * 1024; // 8MB antes de redimensionar

/** Configurações da loja que o próprio dono edita: logo (upload do
 * computador ou link) e cores do painel. Backend em PUT /tenant/aparencia
 * (server/src/routes/tenant.routes.ts) — cada loja tem a sua, não afeta
 * outras lojas nem a marca do produto em si. */
export function ConfiguracoesModal({ aoFechar }: ConfiguracoesModalProps) {
  const { tenant, recarregarSessao } = useTenant();
  const toast = useToast();
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState(tenant?.configuracoes.logoDaLojaUrl ?? '');
  const [erroLogo, setErroLogo] = useState(false);
  const [processandoImagem, setProcessandoImagem] = useState(false);

  const [cor, setCor] = useState(tenant?.configuracoes.corPrincipalDoTema ?? '#10B981');
  const [hoverAutomatico, setHoverAutomatico] = useState(!tenant?.configuracoes.corPrincipalHover);
  const [corHover, setCorHover] = useState(tenant?.configuracoes.corPrincipalHover ?? '#10B981');

  const [salvando, setSalvando] = useState(false);

  async function handleSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      toast.erro('Escolha um arquivo de imagem (PNG, JPG, etc).');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      toast.erro('Imagem muito grande (máx. 8MB).');
      return;
    }
    setProcessandoImagem(true);
    try {
      const dataUrl = await redimensionarImagem(arquivo);
      setLogoUrl(dataUrl);
      setErroLogo(false);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Não consegui processar essa imagem.');
    } finally {
      setProcessandoImagem(false);
    }
  }

  function handleRestaurarIniciais() {
    setLogoUrl(logoIniciaisPadrao(tenant?.nomeFantasia ?? 'Minha Loja'));
    setErroLogo(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      await atualizarAparencia({
        corPrincipalDoTema: cor,
        corPrincipalHover: hoverAutomatico ? null : corHover,
        logoDaLojaUrl: logoUrl.trim() || undefined,
      });
      toast.sucesso('Configurações da loja atualizadas.');
      aoFechar();
      await recarregarSessao();
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Erro ao salvar as configurações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Configurações da loja</p>
        <p className="mt-1 text-sm text-ink-400">Personalize a logo e as cores que aparecem só na sua loja.</p>

        <div className="mt-5">
          <p className="text-sm text-ink-300">Logo da loja</p>
          <div className="mt-1 flex items-center gap-3">
            {logoUrl && !erroLogo ? (
              <img
                src={logoUrl}
                alt="Prévia da logo"
                onError={() => setErroLogo(true)}
                onLoad={() => setErroLogo(false)}
                className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-ink-600"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-tenant text-lg font-semibold text-tenant-foreground">
                {(tenant?.nomeFantasia ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/*"
                onChange={handleSelecionarArquivo}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                disabled={processandoImagem}
                className="rounded-lg border border-ink-600 px-3 py-2 text-xs font-medium text-ink-200 hover:border-tenant hover:text-tenant disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processandoImagem ? 'Processando…' : 'Enviar do computador'}
              </button>
              <button
                type="button"
                onClick={handleRestaurarIniciais}
                className="text-left text-xs text-ink-500 hover:text-ink-300"
              >
                Usar as iniciais da loja (padrão)
              </button>
            </div>
          </div>
          {erroLogo && <p className="mt-1 text-xs text-red-400">Não consegui carregar essa imagem | confira o link.</p>}

          <label className="mt-3 block text-xs text-ink-500">
            Ou cole o link de uma imagem já hospedada
            <input
              value={logoUrl.startsWith('data:') ? '' : logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setErroLogo(false);
              }}
              placeholder="https://exemplo.com/sua-logo.png"
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-tenant focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5">
          <label className="block text-sm text-ink-300">Cor principal do painel</label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(cor) ? cor : '#10B981'}
              onChange={(e) => setCor(e.target.value)}
              className="h-11 w-11 cursor-pointer rounded-lg border border-ink-600 bg-transparent"
            />
            <input
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              placeholder="#10B981"
              className="flex-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 font-mono text-sm text-ink-100 focus:border-tenant focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-ink-500">Usada nos botões, links e destaques do painel | só nessa loja.</p>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-ink-300">Cor de destaque no hover</label>
            <label className="flex items-center gap-1.5 text-xs text-ink-400">
              <input
                type="checkbox"
                checked={hoverAutomatico}
                onChange={(e) => setHoverAutomatico(e.target.checked)}
                className="h-3.5 w-3.5 accent-tenant"
              />
              Calcular automaticamente
            </label>
          </div>
          {!hoverAutomatico && (
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(corHover) ? corHover : '#10B981'}
                onChange={(e) => setCorHover(e.target.value)}
                className="h-11 w-11 cursor-pointer rounded-lg border border-ink-600 bg-transparent"
              />
              <input
                value={corHover}
                onChange={(e) => setCorHover(e.target.value)}
                placeholder="#10B981"
                className="flex-1 rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 font-mono text-sm text-ink-100 focus:border-tenant focus:outline-none"
              />
            </div>
          )}
          <p className="mt-1 text-xs text-ink-500">Cor usada quando o mouse passa por cima de botões e links.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={aoFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando || processandoImagem}
            className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
