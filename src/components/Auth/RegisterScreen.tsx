import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { AuthLayout } from './AuthLayout';

export function RegisterScreen() {
  const { registrar } = useTenant();
  const navigate = useNavigate();
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setMensagemErro(null);
    try {
      await registrar({ nomeFantasia, cnpj, nomeAdmin, email, senha });
      navigate('/', { replace: true });
    } catch (erro) {
      setMensagemErro(erro instanceof Error ? erro.message : 'Erro ao criar a loja.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Criar sua loja"
      subtitulo="Leva menos de um minuto"
      rodape={
        <>
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-tenant hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-ink-300">
          Nome da loja
          <input
            required
            autoFocus
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>

        <label className="block text-sm text-ink-300">
          CNPJ
          <input
            required
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0001-00"
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>

        <label className="block text-sm text-ink-300">
          Seu nome
          <input
            required
            value={nomeAdmin}
            onChange={(e) => setNomeAdmin(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>

        <label className="block text-sm text-ink-300">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>

        <label className="block text-sm text-ink-300">
          Senha
          <input
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
          />
        </label>

        {mensagemErro && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{mensagemErro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-tenant py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Criando loja…' : 'Criar loja'}
        </button>
      </form>
    </AuthLayout>
  );
}
