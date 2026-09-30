import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { assinarToken, requireAuth } from '../middleware/auth.js';
import { cpfValido, normalizarCnpj } from '../lib/documentos.js';
import { emitirSessao, renovarSessao, revogarSessao } from '../lib/sessao.js';
import { mensagemDeValidacao, senhaForte, VERSAO_TERMOS } from '../lib/senha.js';
import { calcularTrialExpiraEm, LIMITES_POR_PLANO, motivoAcessoExpirado } from '../config/planos.js';

export const authRouter = Router();

const textoOpcional = z.string().trim().max(191).optional();

const registerSchema = z.object({
  nomeFantasia: z.string().min(2),
  razaoSocial: z.string().trim().min(2).max(191),
  cnpj: z.string().min(1),
  inscricaoEstadual: textoOpcional,
  inscricaoMunicipal: textoOpcional,
  regimeTributario: textoOpcional,
  telefone: z.string().optional(),
  emailContato: z.string().email().optional().or(z.literal('')),
  site: textoOpcional,
  cep: textoOpcional,
  logradouro: textoOpcional,
  numero: textoOpcional,
  complemento: textoOpcional,
  bairro: textoOpcional,
  cidade: textoOpcional,
  uf: z.string().trim().length(2).optional().or(z.literal('')),
  nomeAdmin: z.string().min(2),
  cpfAdmin: textoOpcional,
  telefoneAdmin: textoOpcional,
  email: z.string().email(),
  senha: senhaForte,
  /** Consentimento explícito: o servidor não cria a conta sem ele. */
  aceitouTermos: z.literal(true, { errorMap: () => ({ message: 'É preciso aceitar os Termos de Uso e a Política de Privacidade.' }) }),
});

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: mensagemDeValidacao(parse.error), detalhes: parse.error.flatten() });
  }
  const {
    nomeFantasia,
    razaoSocial,
    cnpj: cnpjInformado,
    inscricaoEstadual,
    inscricaoMunicipal,
    regimeTributario,
    telefone,
    emailContato,
    site,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    nomeAdmin,
    cpfAdmin,
    telefoneAdmin,
    email,
    senha,
  } = parse.data;

  const cnpj = normalizarCnpj(cnpjInformado);
  if (!cnpj) {
    return res.status(400).json({ erro: 'CNPJ inválido. Confira os números.' });
  }
  if (cpfAdmin && !cpfValido(cpfAdmin)) {
    return res.status(400).json({ erro: 'CPF do responsável inválido.' });
  }

  const emailExistente = await prisma.usuario.findUnique({ where: { email } });
  if (emailExistente) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }
  const cnpjExistente = await prisma.tenant.findUnique({ where: { cnpj } });
  if (cnpjExistente) {
    return res.status(409).json({ erro: 'Já existe uma loja cadastrada com este CNPJ.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { tenant, usuario } = await prisma.$transaction(async (tx) => {
    // Cadastro self-service já entra no STARTER, com um trial — dá pra
    // sentir o valor real do plano (Financeiro, Relatórios) em vez de uma
    // versão capada, o que converte melhor do que um FREE permanente.
    const empresa = await tx.empresa.create({
      data: {
        nome: nomeFantasia,
        planoAtual: 'STARTER',
        trialExpiraEm: calcularTrialExpiraEm(),
      },
    });
    const tenant = await tx.tenant.create({
      data: {
        empresaId: empresa.id,
        nomeFantasia,
        razaoSocial,
        cnpj,
        inscricaoEstadual: inscricaoEstadual || undefined,
        inscricaoMunicipal: inscricaoMunicipal || undefined,
        regimeTributario: regimeTributario || undefined,
        telefone: telefone || undefined,
        email: emailContato || undefined,
        site: site || undefined,
        cep: cep || undefined,
        logradouro: logradouro || undefined,
        numero: numero || undefined,
        complemento: complemento || undefined,
        bairro: bairro || undefined,
        cidade: cidade || undefined,
        uf: uf || undefined,
        logoDaLojaUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeFantasia)}&backgroundType=gradientLinear`,
        corPrincipalDoTema: '#10B981',
      },
    });
    const usuario = await tx.usuario.create({
      data: {
        tenantId: tenant.id,
        nome: nomeAdmin,
        cpf: cpfAdmin || undefined,
        telefone: telefoneAdmin || undefined,
        email,
        senhaHash,
        papel: 'ADMIN',
        raiz: true,
        aceiteTermosEm: new Date(),
        aceiteTermosVersao: VERSAO_TERMOS,
      },
    });
    await tx.categoria.create({ data: { tenantId: tenant.id, nome: 'Geral' } });
    return { tenant, usuario };
  });

  res.status(201).json(await emitirSessao(usuario, req));
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }
  const { email, senha } = parse.data;

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { tenant: { include: { empresa: true } } },
  });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  if (!usuario.tenant.empresa.ativo) {
    return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });
  }
  if (!usuario.tenant.ativo) {
    return res.status(403).json({ erro: 'Esta loja foi desativada pelo responsável da empresa.' });
  }
  // Teste expirado ou assinatura vencida não bloqueiam o login: a pessoa entra e
  // cai na tela do plano pra assinar (ver requireAuth e /auth/me).

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  res.json(await emitirSessao(usuario, req));
});

const refreshSchema = z.object({ refreshToken: z.string().min(20), tenantId: z.string().optional() });

/** Renova a sessão: troca o token de renovação por um par novo. Sem login, pois
 * o próprio token de renovação é a credencial. */
authRouter.post('/refresh', async (req, res) => {
  const parse = refreshSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Requisição inválida.' });

  const r = await renovarSessao(parse.data.refreshToken, req, parse.data.tenantId, possuiAcessoALoja);
  if (!r.ok) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  res.json({ token: r.token, refreshToken: r.refreshToken });
});

authRouter.post('/logout', async (req, res) => {
  const parse = refreshSchema.pick({ refreshToken: true }).safeParse(req.body);
  if (parse.success) await revogarSessao(parse.data.refreshToken);
  res.status(204).end();
});

/** Confere se o usuário pode acessar a loja `tenantId`: é a loja de origem
 * dele (Usuario.tenantId, sempre permitida) ou ele tem um AcessoLoja
 * explícito pra ela E o plano atual da empresa ainda cobre múltiplas lojas.
 * Se a empresa foi rebaixada de ENTERPRISE, as lojas extras ficam
 * inacessíveis (dados preservados, só o acesso é suspenso) até promover de
 * volta — só a loja de origem continua disponível. */
async function possuiAcessoALoja(usuarioId: string, tenantIdHome: string, tenantId: string): Promise<boolean> {
  const alvo = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { ativo: true } });
  if (!alvo?.ativo) return false;
  if (tenantId === tenantIdHome) return true;

  const acesso = await prisma.acessoLoja.findUnique({
    where: { usuarioId_tenantId: { usuarioId, tenantId } },
  });
  if (!acesso) return false;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { empresa: { select: { planoAtual: true } } },
  });
  if (!tenant) return false;
  return LIMITES_POR_PLANO[tenant.empresa.planoAtual].features.multiLoja;
}

authRouter.get('/me', requireAuth, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !usuario.ativo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  // A loja ativa vem do token (pode ser diferente da loja de origem do
  // usuário, se ele trocou de loja — ver POST /auth/trocar-loja), não da
  // coluna Usuario.tenantId.
  const tenantIdAtivo = req.usuario!.tenantId;
  const temAcesso = await possuiAcessoALoja(usuario.id, usuario.tenantId, tenantIdAtivo);
  if (!temAcesso) return res.status(403).json({ erro: 'Você não tem mais acesso a esta loja.' });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantIdAtivo }, include: { empresa: true } });
  if (!tenant) return res.status(404).json({ erro: 'Loja não encontrada.' });
  if (!tenant.empresa.ativo) return res.status(403).json({ erro: 'Esta loja está suspensa. Fale com o suporte.' });

  // As lojas extras (via AcessoLoja) só aparecem no seletor enquanto o plano
  // da empresa cobrir multiLoja — se foi rebaixada, elas somem da lista (os
  // dados continuam intactos, só ficam temporariamente inacessíveis).
  const multiLojaAtivo = LIMITES_POR_PLANO[tenant.empresa.planoAtual].features.multiLoja;
  const acessosExtras = multiLojaAtivo
    ? await prisma.acessoLoja.findMany({
        where: { usuarioId: usuario.id },
        include: { tenant: { select: { id: true, nomeFantasia: true, ativo: true } } },
      })
    : [];
  const lojaHome =
    usuario.tenantId === tenant.id
      ? { id: tenant.id, nomeFantasia: tenant.nomeFantasia, ativo: tenant.ativo }
      : await prisma.tenant.findUnique({ where: { id: usuario.tenantId }, select: { id: true, nomeFantasia: true, ativo: true } });
  const lojas = [lojaHome, ...acessosExtras.map((a) => a.tenant)]
    .filter((l): l is { id: string; nomeFantasia: string; ativo: boolean } => Boolean(l) && l!.ativo !== false)
    .map((l) => ({ id: l.id, nomeFantasia: l.nomeFantasia }));

  res.json({
    usuario: {
      id: usuario.id,
      tenantId: tenant.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      permissoes: (usuario.permissoes as string[] | null) ?? undefined,
      raiz: usuario.raiz,
      ativo: usuario.ativo,
    },
    tenant: {
      id: tenant.id,
      nomeFantasia: tenant.nomeFantasia,
      razaoSocial: tenant.razaoSocial ?? undefined,
      cnpj: tenant.cnpj,
      telefone: tenant.telefone ?? undefined,
      email: tenant.email ?? undefined,
      site: tenant.site ?? undefined,
      inscricaoEstadual: tenant.inscricaoEstadual ?? undefined,
      inscricaoMunicipal: tenant.inscricaoMunicipal ?? undefined,
      regimeTributario: tenant.regimeTributario ?? undefined,
      endereco: {
        cep: tenant.cep ?? undefined,
        logradouro: tenant.logradouro ?? undefined,
        numero: tenant.numero ?? undefined,
        complemento: tenant.complemento ?? undefined,
        bairro: tenant.bairro ?? undefined,
        cidade: tenant.cidade ?? undefined,
        uf: tenant.uf ?? undefined,
      },
      planoAtual: tenant.empresa.planoAtual,
      trialExpiraEm: tenant.empresa.trialExpiraEm?.toISOString() ?? undefined,
      assinatura: {
        status: tenant.empresa.assinaturaStatus,
        acessoAte: tenant.empresa.acessoAte?.toISOString() ?? undefined,
        canceladaEm: tenant.empresa.canceladaEm?.toISOString() ?? undefined,
      },
      acessoExpirado: motivoAcessoExpirado(tenant.empresa) ?? undefined,
      configuracoes: {
        logoDaLojaUrl: tenant.logoDaLojaUrl,
        corPrincipalDoTema: tenant.corPrincipalDoTema,
        corPrincipalHover: tenant.corPrincipalHover ?? undefined,
        fusoHorario: tenant.fusoHorario,
        moeda: tenant.moeda,
        exigirSenhaAoAbrirCaixa: tenant.exigirSenhaAoAbrirCaixa,
      },
      criadoEm: tenant.criadoEm.toISOString(),
    },
    lojas,
  });
});

const trocarLojaSchema = z.object({ tenantId: z.string().min(1) });

authRouter.post('/trocar-loja', requireAuth, async (req, res) => {
  const parse = trocarLojaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Loja inválida.' });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !usuario.ativo) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const temAcesso = await possuiAcessoALoja(usuario.id, usuario.tenantId, parse.data.tenantId);
  if (!temAcesso) return res.status(403).json({ erro: 'Você não tem acesso a essa loja.' });

  const token = assinarToken({ id: usuario.id, tenantId: parse.data.tenantId, papel: usuario.papel, tv: usuario.tokenVersion });
  res.json({ token });
});
