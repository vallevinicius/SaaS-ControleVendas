import 'dotenv/config';
import cors from 'cors';
import express from 'express';
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
import { adminRouter } from './routes/admin.routes.js';
import { garantirAdminPlataforma } from './lib/adminBootstrap.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

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
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

garantirAdminPlataforma().finally(() => {
  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
});
