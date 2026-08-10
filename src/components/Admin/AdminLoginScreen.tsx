import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/contexts/ToastContext';

export function AdminLoginScreen() {
  const { login } = useAdminAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await login(email, senha);
      navigate('/admin', { replace: true });
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-lg font-bold text-black">
            TS
          </div>
          <p className="font-display text-lg font-semibold tracking-tight text-zinc-100">Total Software</p>
          <p className="text-xs text-zinc-500">Painel interno — uso restrito</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-zinc-400">
              E-mail
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <label className="block text-sm text-zinc-400">
              Senha
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
