import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

/** Restringe a rota à conta principal (raiz) da loja — usado onde a ação
 * afeta a loja/empresa como um todo (gerenciar vendedores, criar novas lojas). */
export async function requireContaPrincipal(req: Request, res: Response, next: NextFunction) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id }, select: { raiz: true } });
  if (!usuario?.raiz) {
    return res.status(403).json({ erro: 'Só a conta principal da loja pode fazer isso.' });
  }
  next();
}
