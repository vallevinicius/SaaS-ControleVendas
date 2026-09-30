import { useState, type FormEvent } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { adminCriarEmpresa } from '@/services/apiService';
import { cnpjValido, cpfValido, mascararCep, mascararCnpj, mascararCpf, mascararTelefone } from '@/utils/mascaras';
import { TIPOS_EMPRESA, UFS } from '@/utils/empresa';
import { AuthInput } from '@/components/Auth/AuthInput';
import { AuthCombobox } from '@/components/Auth/AuthCombobox';
import type { PlanoSaaS } from '@/types';
import { ModalFundo } from './AdminModais';

const PLANOS: PlanoSaaS[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const CLASSE_SELECT =
  'mt-1.5 w-full rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-sm text-ink-100 focus:border-tenant focus:outline-none focus:ring-2 focus:ring-tenant/15';

const vazio = {
  nomeFantasia: '', razaoSocial: '', cnpj: '', inscricaoEstadual: '', inscricaoMunicipal: '', regimeTributario: '',
  telefone: '', email: '', site: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  planoAtual: 'STARTER' as PlanoSaaS,
  nomeAdmin: '', cpfAdmin: '', telefoneAdmin: '', emailAdmin: '', senhaAdmin: '',
};

function Titulo({ children }: { children: string }) {
  return <p className="col-span-full mt-2 border-b border-ink-700 pb-2 text-xs font-semibold uppercase tracking-wider text-tenant">{children}</p>;
}

/** Cria uma empresa (com a primeira loja e o login principal) pelo painel da
 * Total Software, já com todos os dados cadastrais. */
export function NovaEmpresaModal({ onFechar, onCriada }: { onFechar: () => void; onCriada: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(vazio);
  const [enviando, setEnviando] = useState(false);
  const campo = <K extends keyof typeof vazio>(k: K) => ({
    value: f[k] as string,
    onChange: (e: { target: { value: string } }) => setF((atual) => ({ ...atual, [k]: e.target.value })),
  });
  const set = <K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) => setF((atual) => ({ ...atual, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!cnpjValido(f.cnpj)) return toast.erro('CNPJ inválido. Confira os números.');
    if (f.cpfAdmin && !cpfValido(f.cpfAdmin)) return toast.erro('CPF do responsável inválido.');

    setEnviando(true);
    try {
      const opcional = (v: string) => v.trim() || undefined;
      await adminCriarEmpresa({
        nomeFantasia: f.nomeFantasia.trim(),
        razaoSocial: opcional(f.razaoSocial),
        cnpj: f.cnpj,
        inscricaoEstadual: opcional(f.inscricaoEstadual),
        inscricaoMunicipal: opcional(f.inscricaoMunicipal),
        regimeTributario: opcional(f.regimeTributario),
        telefone: opcional(f.telefone),
        email: opcional(f.email),
        site: opcional(f.site),
        cep: opcional(f.cep),
        logradouro: opcional(f.logradouro),
        numero: opcional(f.numero),
        complemento: opcional(f.complemento),
        bairro: opcional(f.bairro),
        cidade: opcional(f.cidade),
        uf: opcional(f.uf),
        planoAtual: f.planoAtual,
        nomeAdmin: f.nomeAdmin.trim(),
        cpfAdmin: opcional(f.cpfAdmin),
        telefoneAdmin: opcional(f.telefoneAdmin),
        emailAdmin: f.emailAdmin.trim(),
        senhaAdmin: f.senhaAdmin,
      });
      toast.sucesso(`Empresa "${f.nomeFantasia.trim()}" criada.`);
      onCriada();
    } catch (erro) {
      toast.erro(erro instanceof Error ? erro.message : 'Erro ao criar a empresa.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ModalFundo onFechar={onFechar}>
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-ink-700 bg-ink-800">
        <div className="border-b border-ink-700 px-6 py-4">
          <p className="font-display text-lg font-semibold text-ink-100">Nova empresa</p>
          <p className="text-sm text-ink-400">Cria a empresa, a primeira loja e o login principal.</p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-6">
          <Titulo>Dados da empresa</Titulo>
          <div className="sm:col-span-2">
            <AuthInput label="CNPJ *" required inputMode="numeric" maxLength={18} placeholder="00.000.000/0001-00"
              value={f.cnpj} onChange={(e) => set('cnpj', mascararCnpj(e.target.value))} />
          </div>
          <div className="sm:col-span-2"><AuthInput label="Razão social" {...campo('razaoSocial')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Nome fantasia *" required {...campo('nomeFantasia')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Inscrição estadual" {...campo('inscricaoEstadual')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Inscrição municipal" {...campo('inscricaoMunicipal')} /></div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-300">
              Plano
              <select value={f.planoAtual} onChange={(e) => set('planoAtual', e.target.value as PlanoSaaS)} className={CLASSE_SELECT}>
                {PLANOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <div className="sm:col-span-6">
            <AuthCombobox label="Tipo de empresa / regime tributário" value={f.regimeTributario}
              onChange={(v) => set('regimeTributario', v)} grupos={TIPOS_EMPRESA} placeholder="Escolha uma opção ou digite" />
          </div>

          <Titulo>Contato e endereço</Titulo>
          <div className="sm:col-span-2">
            <AuthInput label="Telefone" inputMode="numeric" maxLength={15} placeholder="(00) 00000-0000"
              value={f.telefone} onChange={(e) => set('telefone', mascararTelefone(e.target.value))} />
          </div>
          <div className="sm:col-span-2"><AuthInput label="E-mail da empresa" type="email" {...campo('email')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Site" {...campo('site')} /></div>
          <div className="sm:col-span-2">
            <AuthInput label="CEP" inputMode="numeric" maxLength={9} placeholder="00000-000"
              value={f.cep} onChange={(e) => set('cep', mascararCep(e.target.value))} />
          </div>
          <div className="sm:col-span-4"><AuthInput label="Rua / Avenida" {...campo('logradouro')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Número" {...campo('numero')} /></div>
          <div className="sm:col-span-4"><AuthInput label="Complemento" {...campo('complemento')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Bairro" {...campo('bairro')} /></div>
          <div className="sm:col-span-4"><AuthInput label="Cidade" {...campo('cidade')} /></div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink-300">
              Estado
              <select value={f.uf} onChange={(e) => set('uf', e.target.value)} className={CLASSE_SELECT}>
                <option value="">UF</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>

          <Titulo>Responsável e acesso</Titulo>
          <div className="sm:col-span-3"><AuthInput label="Nome completo *" required {...campo('nomeAdmin')} /></div>
          <div className="sm:col-span-3">
            <AuthInput label="CPF" inputMode="numeric" maxLength={14} placeholder="000.000.000-00"
              value={f.cpfAdmin} onChange={(e) => set('cpfAdmin', mascararCpf(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <AuthInput label="Celular / WhatsApp" inputMode="numeric" maxLength={15} placeholder="(00) 00000-0000"
              value={f.telefoneAdmin} onChange={(e) => set('telefoneAdmin', mascararTelefone(e.target.value))} />
          </div>
          <div className="sm:col-span-2"><AuthInput label="E-mail de acesso *" type="email" required {...campo('emailAdmin')} /></div>
          <div className="sm:col-span-2"><AuthInput label="Senha *" type="password" required minLength={8} placeholder="8+ caracteres, com letras e números" alternarVisibilidade {...campo('senhaAdmin')} /></div>
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-700 px-6 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">Cancelar</button>
          <button type="submit" disabled={enviando}
            className="rounded-lg bg-tenant px-5 py-2 text-sm font-semibold text-tenant-foreground hover:opacity-90 disabled:opacity-40">
            {enviando ? 'Criando…' : 'Criar empresa'}
          </button>
        </div>
      </form>
    </ModalFundo>
  );
}
