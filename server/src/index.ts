import 'dotenv/config';
// Precisa vir antes das rotas: faz o Express 4 capturar erros de handlers async
// (sem isso, um erro do Prisma numa rota derrubaria o processo inteiro).
import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes.js';
import { produtosRouter } from './routes/produtos.routes.js';
import { categoriasRouter } from './routes/categorias.routes.js';
import { clientesRouter } from './routes/clientes.routes.js';
import { vendasRouter } from './routes/vendas.routes.js';
import { estoqueRouter } from './routes/estoque.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { relatoriosRouter } from './routes/relatorios.routes.js';
import { financeiroRouter } from './routes/financeiro.routes.js';
import { usuariosRouter } from './routes/usuarios.routes.js';
import { caixaRouter } from './routes/caixa.routes.js';
import { vendedoresRouter } from './routes/vendedores.routes.js';
import { lojasRouter } from './routes/lojas.routes.js';
import { assinaturaRouter } from './routes/assinatura.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { auditoriaRouter } from './routes/auditoria.routes.js';
import { tenantRouter } from './routes/tenant.routes.js';
import { garantirAdminPlataforma } from './lib/adminBootstrap.js';
import { limparSessoesAntigas } from './lib/sessao.js';
import { prisma } from './lib/prisma.js';
import {
  configurarCors,
  limiteCadastro,
  limiteGeral,
  limiteCodigoAdmin,
  limiteLoginAdmin,
  limiteLoginPorConta,
  limiteLoginPorIp,
  limiteRefresh,
  limiteWebhook,
  tratarErros,
} from './middleware/seguranca.js';

const app = express();

// Atrás de proxy/balanceador (produção), TRUST_PROXY diz quantos saltos confiar
// pra req.ip refletir o IP real do cliente (senão o limite vale pro proxy todo).
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(helmet());
app.use(configurarCors());
// Só a logo da loja (imagem em base64) precisa de corpo grande; o resto aceita
// até 1 MB (cobre a importação de produtos por planilha).
app.use('/api/tenant/aparencia', express.json({ limit: '3mb' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', limiteGeral);
app.post('/api/auth/login', limiteLoginPorIp, limiteLoginPorConta);
app.post('/api/auth/register', limiteCadastro);
app.post('/api/auth/refresh', limiteRefresh);
app.post('/api/admin/login', limiteLoginAdmin);
app.post('/api/admin/login/2fa', limiteCodigoAdmin);
app.post('/api/assinatura/webhook', limiteWebhook);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
// Para monitor de disponibilidade (UptimeRobot, etc.): confirma que o banco responde.
app.get('/api/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', banco: 'ok' });
  } catch {
    res.status(503).json({ status: 'erro', banco: 'indisponivel' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/vendas', vendasRouter);
app.use('/api/estoque', estoqueRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/financeiro', financeiroRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/caixa', caixaRouter);
app.use('/api/vendedores', vendedoresRouter);
app.use('/api/lojas', lojasRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/admin', adminRouter);
app.use('/api/assinatura', assinaturaRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(tratarErros);

process.on('unhandledRejection', (motivo) => console.error('Promessa rejeitada sem tratamento:', motivo));
process.on('uncaughtException', (erro) => {
  console.error('Exceção não capturada, encerrando:', erro);
  process.exit(1);
});

// Falha ao garantir o admin (ex: banco fora do ar) não impede a API de subir:
// só avisa, e o painel admin fica sem login até o banco voltar e reiniciar.
garantirAdminPlataforma()
  .catch((erro) => console.error('Não foi possível preparar o admin da plataforma:', erro))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
    // Faxina das renovações vencidas: na subida e a cada 6 horas.
    const faxina = () => limparSessoesAntigas().catch((e) => console.error('Falha na limpeza de sessões:', e));
    faxina();
    setInterval(faxina, 6 * 3_600_000).unref();
  });
