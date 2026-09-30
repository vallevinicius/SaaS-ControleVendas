import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { ErroApi, loginAdmin } from '@/services/apiService';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { AuthCheckbox } from './AuthCheckbox';
import { IconeEmail, IconeSenha } from './icones';

const CHAVE_EMAIL_LEMBRADO = 'tc-login-email-lembrado';

function lerEmailLembrado(): string {
  try {
    return localStorage.getItem(CHAVE_EMAIL_LEMBRADO) ?? '';
  } catch {
    return '';
  }
}

export function LoginScreen() {
  const { login } = useTenant();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState(lerEmailLembrado);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(() => Boolean(lerEmailLembrado()));
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await login(email, senha);
      try {
        if (lembrar) localStorage.setItem(CHAVE_EMAIL_LEMBRADO, email);
        else localStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
      } catch {
        // Armazenamento local indisponível (modo privado, etc.) — não impede o login.
      }
      navigate('/', { replace: true });
    } catch (erro) {
      // 401 = credenciais não batem com nenhuma loja — tenta como admin da
      // plataforma antes de desistir. Outros status (ex: 403 de loja
      // suspensa/trial expirado) já têm mensagem própria e não devem cair
      // nessa segunda tentativa.
      if (!(erro instanceof ErroApi) || erro.status !== 401) {
        toast.erro(erro instanceof Error ? erro.message : 'Erro ao entrar.');
        setEnviando(false);
        return;
      }
      try {
        await loginAdmin(email, senha);
        navigate('/admin', { replace: true });
      } catch {
        toast.erro('E-mail ou senha inválidos.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Entrar"
      subtitulo="Acesse o painel da sua loja"
      rodape={
        <>
          Ainda não tem uma loja?{' '}
          <Link to="/registrar" className="font-medium text-tenant hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="E-mail"
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icone={<IconeEmail className="h-4 w-4" />}
        />

        <AuthInput
          label="Senha"
          type="password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          icone={<IconeSenha className="h-4 w-4" />}
          alternarVisibilidade
        />

        <AuthCheckbox checked={lembrar} onChange={(e) => setLembrar(e.target.checked)}>
          Lembrar meu e-mail neste dispositivo
        </AuthCheckbox>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-tenant py-2.5 text-sm font-semibold text-tenant-foreground shadow-sm shadow-tenant/20 transition-all hover:shadow-md hover:shadow-tenant/25 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}
