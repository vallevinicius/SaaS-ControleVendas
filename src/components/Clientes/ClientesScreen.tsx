import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '@/components/Layout/AppLayout';
import { LoadingState } from '@/components/Common/LoadingState';
import { useToast } from '@/contexts/ToastContext';
import { getClientes, createCliente } from '@/services/apiService';
import type { Cliente } from '@/types';

export function ClientesScreen() {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function carregarClientes() {
    setCarregando(true);
    setClientes(await getClientes());
    setCarregando(false);
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setEnviando(true);
    try {
      await createCliente({ nome: nome.trim(), telefone: telefone || undefined, email: email || undefined, cpfCnpj: cpfCnpj || undefined });
      toast.sucesso(`Cliente "${nome.trim()}" cadastrado.`);
      setNome('');
      setTelefone('');
      setEmail('');
      setCpfCnpj('');
      setMostrarFormulario(false);
      await carregarClientes();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao cadastrar cliente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppLayout titulo="Clientes" subtitulo="Cadastro de clientes para vincular às vendas">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setMostrarFormulario((atual) => !atual)}
          className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90"
        >
          {mostrarFormulario ? 'Cancelar' : '+ Novo cliente'}
        </button>
      </div>

      {mostrarFormulario && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-ink-700 bg-ink-800 p-6"
        >
          <label className="block text-sm text-ink-300">
            Nome
            <input
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>
          <label className="block text-sm text-ink-300">
            Telefone
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>
          <label className="block text-sm text-ink-300">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>
          <label className="block text-sm text-ink-300">
            CPF/CNPJ
            <input
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-ink-100 focus:border-tenant focus:outline-none"
            />
          </label>

          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'Salvando…' : 'Salvar cliente'}
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <LoadingState mensagem="Carregando clientes…" />
      ) : clientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700 p-10 text-center">
          <p className="text-sm text-ink-400">Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-800 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">CPF/CNPJ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700 bg-ink-800/40">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="transition-colors hover:bg-ink-800">
                  <td className="px-5 py-3.5 font-medium text-ink-100">{cliente.nome}</td>
                  <td className="px-5 py-3.5 text-ink-300">{cliente.telefone ?? '—'}</td>
                  <td className="px-5 py-3.5 text-ink-300">{cliente.email ?? '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-400">{cliente.cpfCnpj ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
