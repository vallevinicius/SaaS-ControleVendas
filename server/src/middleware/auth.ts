import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { motivoAcessoExpirado } from '../config/planos.js';

export interface UsuarioAutenticado {
  id: string;
  tenantId: string;
  papel: 'ADMIN' | 'GERENTE' | 'OPERADOR_CAIXA';
  tipo?: undefined;
}

export interface AdminAutenticado {
  id: string;
  tipo: 'PLATAFORMA';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
      admin?: AdminAutenticado;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado em server/.env');
}

export function assinarToken(payload: UsuarioAutenticado): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

export function assinarTokenAdmin(payload: { id: string }): string {
  const claims: AdminAutenticado = { id: payload.id, tipo: 'PLATAFORMA' };
  return jwt.sign(claims, JWT_SECRET as string, { expiresIn: '7d' });
}

function extrairToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Autentica usuários de uma loja (tenant). Rejeita tokens do painel admin e
 * de lojas que o dono desativou (o token continua válido até expirar, então
 * a checagem precisa acontecer a cada requisição). */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extrairToken(req);
  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação ausente.' });
  }

  let payload: UsuarioAutenticado | AdminAutenticado;
  try {
    payload = jwt.verify(token, JWT_SECRET as string) as UsuarioAutenticado | AdminAutenticado;
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
  if ('tipo' in payload && payload.tipo === 'PLATAFORMA') {
    return res.status(403).json({ erro: 'Token de admin não pode ser usado aqui.' });
  }

  try {
    const loja = await prisma.tenant.findUnique({
      where: { id: (payload as UsuarioAutenticado).tenantId },
      select: { ativo: true, empresa: { select: { trialExpiraEm: true, assinaturaStatus: true, acessoAte: true } } },
    });
    if (loja && !loja.ativo) {
      return res.status(403).json({ erro: 'Esta loja foi desativada.' });
    }
    // Teste grátis acabado ou assinatura cancelada com o período já vencido: o
    // login continua valendo, mas só a sessão e a tela do plano funcionam, pra
    // a pessoa conseguir assinar de novo.
    const liberadas = req.originalUrl.startsWith('/api/assinatura') || req.originalUrl.startsWith('/api/auth');
    if (loja && !liberadas && motivoAcessoExpirado(loja.empresa)) {
      return res.status(402).json({ erro: 'Seu acesso expirou. Escolha um plano para continuar.', codigo: 'ACESSO_EXPIRADO' });
    }
  } catch (erro) {
    return next(erro);
  }

  req.usuario = payload as UsuarioAutenticado;
  next();
}

/** Autentica o admin interno da Total Software (painel /admin). */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extrairToken(req);
  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as UsuarioAutenticado | AdminAutenticado;
    if (!('tipo' in payload) || payload.tipo !== 'PLATAFORMA') {
      return res.status(403).json({ erro: 'Acesso restrito ao painel administrativo.' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}
