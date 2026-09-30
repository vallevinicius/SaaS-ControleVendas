import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { admin2faAtivar, admin2faDesativar, admin2faIniciar, admin2faStatus } from '@/services/apiService';
import { LoadingState } from '@/components/Common/LoadingState';
import { ModalFundo } from './AdminModais';

const CAMPO = 'mt-1.5 w-full rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-sm text-ink-100 focus:border-tenant focus:outline-none focus:ring-2 focus:ring-tenant/15';

/** Verificação em duas etapas do admin: ativar com um aplicativo autenticador
 * (Google Authenticator, Authy, 1Password...) ou desativar. */
export function SegurancaModal({ onFechar, onMudou }: { onFechar: () => void; onMudou: (ativo: boolean) => void }) {
  const toast = useToast();
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [config, setConfig] = useState<{ segredo: string; qrCode: string } | null>(null);
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    admin2faStatus().then((r) => setAtivo(r.ativo)).catch(() => setAtivo(false));
  }, []);

  async function iniciar() {
    try {
      setConfig(await admin2faIniciar());
    } catch (e) {
      toast.erro(e instanceof Error ? e.message : 'Não foi possível iniciar.');
    }
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (ativo) await admin2faDesativar(senha, codigo);
      else await admin2faAtivar(codigo);
      const novo = !ativo;
      toast.sucesso(novo ? 'Verificação em duas etapas ativada.' : 'Verificação em duas etapas desativada.');
      setAtivo(novo);
      onMudou(novo);
      setConfig(null);
      setCodigo('');
      setSenha('');
      if (novo) onFechar();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Não foi possível confirmar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalFundo onFechar={onFechar}>
      <div className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Segurança do painel</p>
        <p className="mt-1 text-sm text-ink-400">
          Com a verificação em duas etapas, além da senha é preciso o código do seu celular para entrar. Se a senha vazar, ninguém acessa os dados dos clientes.
        </p>

        {ativo === null ? (
          <LoadingState mensagem="Carregando…" />
        ) : ativo ? (
          <form onSubmit={confirmar} className="mt-5 space-y-3">
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">Verificação em duas etapas ativa.</p>
            <p className="text-xs text-ink-500">Para desativar, confirme sua senha e o código atual do aplicativo.</p>
            <label className="block text-sm text-ink-300">
              Senha
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={CAMPO} />
            </label>
            <label className="block text-sm text-ink-300">
              Código do aplicativo
              <input required inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className={CAMPO} />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Fechar</button>
              <button type="submit" disabled={enviando || codigo.length !== 6 || !senha} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
                {enviando ? 'Desativando…' : 'Desativar'}
              </button>
            </div>
          </form>
        ) : !config ? (
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Agora não</button>
            <button onClick={iniciar} className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90">Ativar</button>
          </div>
        ) : (
          <form onSubmit={confirmar} className="mt-5 space-y-3">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-300">
              <li>Abra o aplicativo autenticador no celular.</li>
              <li>Escaneie o QR code (ou digite a chave abaixo).</li>
              <li>Digite o código de 6 dígitos que o aplicativo mostrar.</li>
            </ol>
            <img src={config.qrCode} alt="QR code para o aplicativo autenticador" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" />
            <p className="select-all break-all rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2 text-center font-mono text-xs text-ink-200">{config.segredo}</p>
            <label className="block text-sm text-ink-300">
              Código de 6 dígitos
              <input autoFocus required inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className={CAMPO} />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Cancelar</button>
              <button type="submit" disabled={enviando || codigo.length !== 6} className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:opacity-40">
                {enviando ? 'Confirmando…' : 'Confirmar e ativar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalFundo>
  );
}
