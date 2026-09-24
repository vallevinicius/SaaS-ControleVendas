import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { mascararCnpj, mascararTelefone } from '@/utils/mascaras';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { IconeEmail, IconeId, IconeLoja, IconeSenha, IconeTelefone, IconeUsuario } from './icones';

export function RegisterScreen() {
  const { registrar } = useTenant();
  const toast = useToast();
  const navigate = useNavigate();
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!aceitouTermos) return;
    setEnviando(true);
    try {
      await registrar({ nomeFantasia, cnpj, telefone: telefone || undefined, nomeAdmin, email, senha });
      toast.sucesso('Loja criada com sucesso.');
      navigate('/', { replace: true });
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao criar a loja.');
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
        <AuthInput
          label="Nome da loja"
          required
          autoFocus
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          icone={<IconeLoja className="h-4 w-4" />}
        />

        <AuthInput
          label="CNPJ"
          required
          inputMode="numeric"
          value={cnpj}
          onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
          placeholder="00.000.000/0001-00"
          maxLength={18}
          icone={<IconeId className="h-4 w-4" />}
        />

        <AuthInput
          label="Telefone da loja"
          inputMode="numeric"
          value={telefone}
          onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
          placeholder="(00) 00000-0000"
          maxLength={15}
          icone={<IconeTelefone className="h-4 w-4" />}
        />

        <AuthInput
          label="Seu nome"
          required
          value={nomeAdmin}
          onChange={(e) => setNomeAdmin(e.target.value)}
          icone={<IconeUsuario className="h-4 w-4" />}
        />

        <AuthInput
          label="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icone={<IconeEmail className="h-4 w-4" />}
        />

        <AuthInput
          label="Senha"
          type="password"
          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          icone={<IconeSenha className="h-4 w-4" />}
          alternarVisibilidade
        />

        <label className="flex items-start gap-2.5 text-sm text-ink-400">
          <input
            type="checkbox"
            required
            checked={aceitouTermos}
            onChange={(e) => setAceitouTermos(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-tenant"
          />
          <span>
            Li e concordo com os{' '}
            <Link to="/termos" target="_blank" className="font-medium text-tenant hover:underline">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacidade" target="_blank" className="font-medium text-tenant hover:underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={enviando || !aceitouTermos}
          className="w-full rounded-lg bg-tenant py-2.5 text-sm font-semibold text-tenant-foreground shadow-sm shadow-tenant/20 transition-all hover:shadow-md hover:shadow-tenant/25 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {enviando ? 'Criando loja…' : 'Criar loja'}
        </button>
      </form>
    </AuthLayout>
  );
}
