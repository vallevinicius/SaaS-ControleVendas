import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

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

/** Autentica usuários de uma loja (tenant). Rejeita tokens do painel admin. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extrairToken(req);
  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as UsuarioAutenticado | AdminAutenticado;
    if ('tipo' in payload && payload.tipo === 'PLATAFORMA') {
      return res.status(403).json({ erro: 'Token de admin não pode ser usado aqui.' });
    }
    req.usuario = payload as UsuarioAutenticado;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
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
