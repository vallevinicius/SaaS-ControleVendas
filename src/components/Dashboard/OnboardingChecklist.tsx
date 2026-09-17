import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { searchProducts, getUsuarios, getHistoricoCaixas } from '@/services/apiService';

interface ItemChecklist {
  id: string;
  rotulo: string;
  rota: string;
  feito: boolean;
}

function chaveDispensado(tenantId: string): string {
  return `total_control_onboarding_dispensado_${tenantId}`;
}

/** Checklist de primeiros passos pra quem acabou de criar a loja — some
 * sozinho quando tudo é concluído, ou se a pessoa dispensar manualmente. */
export function OnboardingChecklist() {
  const { tenant, usuarioAtual } = useTenant();
  const [itens, setItens] = useState<ItemChecklist[] | null>(null);
  const [dispensado, setDispensado] = useState(true);

  useEffect(() => {
    if (!tenant || usuarioAtual?.papel !== 'ADMIN') return;
    setDispensado(localStorage.getItem(chaveDispensado(tenant.id)) === '1');

    async function carregar() {
      const [produtos, usuarios, caixas] = await Promise.all([
        searchProducts('', 1, 1),
        getUsuarios(),
        getHistoricoCaixas(),
      ]);
      setItens([
        { id: 'produto', rotulo: 'Cadastre seu primeiro produto', rota: '/estoque', feito: produtos.total > 0 },
        { id: 'caixa', rotulo: 'Abra o caixa e faça uma venda', rota: '/pdv', feito: caixas.length > 0 },
        { id: 'equipe', rotulo: 'Convide alguém da sua equipe', rota: '/usuarios', feito: usuarios.length > 1 },
      ]);
    }
    carregar();
  }, [tenant, usuarioAtual?.papel]);

  if (dispensado || !itens || usuarioAtual?.papel !== 'ADMIN') return null;
  if (itens.every((i) => i.feito)) return null;

  return (
    <div className="rounded-xl border border-tenant/40 bg-tenant-soft p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-ink-100">Primeiros passos na sua loja</p>
        <button
          onClick={() => {
            if (tenant) localStorage.setItem(chaveDispensado(tenant.id), '1');
            setDispensado(true);
          }}
          className="text-xs text-ink-400 hover:text-ink-200"
        >
          Dispensar
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {itens.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <span aria-hidden className={item.feito ? 'text-tenant' : 'text-ink-500'}>
              {item.feito ? '✓' : '○'}
            </span>
            {item.feito ? (
              <span className="text-ink-400 line-through">{item.rotulo}</span>
            ) : (
              <Link to={item.rota} className="text-ink-200 hover:text-tenant">
                {item.rotulo}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
