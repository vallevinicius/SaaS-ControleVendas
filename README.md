# Total Control — Controle de Estoque e Vendas

SaaS multi-tenant de PDV (Ponto de Venda) e controle de estoque, construído
em **React + TypeScript + Vite + TailwindCSS** no frontend e
**Express + Prisma + MySQL** no backend.

---

## Como rodar

Pré-requisitos: Node.js 18+ e um servidor MySQL acessível.

### 1. Configurar o banco de dados

Edite `server/.env` com a string de conexão do seu MySQL:

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
JWT_SECRET="troque-por-um-valor-aleatorio-longo"
PORT=4000

# Login do painel interno da Total Software em /admin (separado do login
# das lojas). Troque esses valores e reinicie a API para criar/atualizar
# essa conta.
ADMIN_EMAIL="admin@totalsoftware.com"
ADMIN_SENHA="troque-por-uma-senha-forte"
```

Depois, dentro de `server/`:

```bash
cd server
npm install
npx prisma migrate dev --name init   # cria as tabelas no banco
npx prisma db seed                   # cria uma loja + usuário de teste
```

O seed cria o login `admin@totalcontrol.local` / senha `Admin@123`. Você
também pode criar uma loja nova pela tela de registro do app.

### 1.1. Painel interno da Total Software

Em `http://localhost:3099/#/admin/login`, com o `ADMIN_EMAIL`/`ADMIN_SENHA`
definidos no `server/.env`. Esse login não pertence a nenhuma loja — é de
uso exclusivo da equipe da Total Software para listar todos os
estabelecimentos, trocar o plano de uma loja, ativar/desativar o login de um
usuário ou resetar a senha de alguém que perdeu acesso. Não há link para
essa tela em nenhum menu do app de loja — é acesso só por URL direta.

### 2. Rodar o frontend + backend juntos

Na raiz do projeto:

```bash
npm install
npm run dev:full
```

Isso sobe o frontend em **http://localhost:3099** e a API em
**http://localhost:4000**. Se preferir rodar cada parte em um terminal
separado: `npm run dev` (frontend) e `npm --prefix server run dev` (API).

```bash
npm run build     # build de produção do frontend (roda o type-check do TS antes)
npm run preview   # serve o build de produção localmente
```

> Antes de subir/commitar qualquer alteração, faça login, cadastre um
> produto, dê entrada de estoque e finalize uma venda no PDV (com desconto)
> para garantir que o fluxo ponta a ponta continua funcionando.

---

## Arquitetura

```
src/
  types/                  Modelos de dados (Tenant, Produto, Transacao...)
  services/
    apiService.ts           Cliente HTTP da API real (fetch + JWT)
  contexts/
    TenantContext.tsx      Sessão ativa (tenant + usuário) resolvida via JWT
  utils/
    formatters.ts          Formatação de moeda/data sensível ao tenant
  components/
    Auth/                    Login e registro de loja
    Layout/                  Sidebar, Header, AppLayout
    PDV/                     Frente de Caixa
    Estoque/                 Gestão de Estoque
    Clientes/                Cadastro de clientes
    Relatorios/              Relatórios de vendas por período
    Financeiro/              Fluxo de caixa e lançamentos avulsos
    Admin/                   Painel interno da Total Software (/admin)
    Dashboard/               Visão Geral
    Common/                  Componentes visuais reutilizáveis
  App.tsx                  Rotas (com guard de autenticação de loja e de admin)
  main.tsx                 Bootstrap da aplicação

server/
  prisma/schema.prisma     Modelo de dados (MySQL)
  src/routes/               Endpoints da API (auth, produtos, categorias,
                             clientes, vendas, estoque, dashboard, relatórios,
                             financeiro, admin)
  src/middleware/auth.ts    JWT: assina e valida o token de sessão de loja e
                             o token do painel admin (tipo PLATAFORMA)
  src/lib/adminBootstrap.ts Cria/atualiza a conta de admin a partir do .env
```

### 1. Multi-tenancy

Nenhum dado visual da loja (nome, logo, cor do tema, CNPJ, fuso horário) está
hardcoded em componente algum. Tudo vem do `TenantContext`
(`src/contexts/TenantContext.tsx`), que resolve a sessão ativa a partir do
JWT retornado no login/registro e expõe `useTenant()` para qualquer
componente consumir `tenant`, `usuarioAtual`, `login`, `registrar` e
`logout`.

### 2. Isolamento de dados

Toda rota da API (`server/src/routes/*.ts`) exige autenticação
(`requireAuth`) e filtra qualquer consulta pelo `tenantId` extraído do JWT —
nenhuma tela do frontend nunca vê dados de outra loja.

### 3. Segmento agnóstico

Não existem tabelas fixas de "Tamanho" ou "Placa". A entidade `Categoria` é
criada dinamicamente pelo tenant e pode carregar `atributosCustomizados`
livres (chave + tipo), atribuídos por produto.

### 4. Transações — a espinha dorsal

Toda entrada (`ENTRADA`) e saída (`SAIDA`) de estoque é registrada como uma
`Transacao`, com `timestamp` exato, itens com snapshot de preço praticado,
forma de pagamento, desconto e usuário responsável. É a partir dela que o
Dashboard e os Relatórios calculam faturamento, ticket médio e produtos mais
vendidos.

### 5. Financeiro

A tela Financeiro combina a receita de vendas e o custo de entradas de
estoque (já existentes como `Transacao`) com lançamentos manuais de
receita/despesa avulsa (`LancamentoFinanceiro` — aluguel, salário etc.),
calculando o saldo do período.

### 6. Painel admin — uma segunda identidade, de propósito

O admin da Total Software não é um `Usuario` de loja — ele é modelado como
`AdminPlataforma`, uma entidade própria sem `tenantId`, com login e JWT
próprios (`tipo: 'PLATAFORMA'`). O middleware `requireAuth` (rotas de loja) e
`requirePlatformAdmin` (rotas `/api/admin`) se rejeitam mutuamente, então um
token de loja nunca funciona no painel admin e vice-versa.
