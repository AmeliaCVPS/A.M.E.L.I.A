import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Não autenticado", mensagem: "Faça login para continuar." });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Não autenticado", mensagem: "Faça login para continuar." });
    return;
  }
  if (req.session.papel !== "admin") {
    res.status(403).json({ error: "Acesso negado", mensagem: "Apenas administradores podem acessar este recurso." });
    return;
  }
  next();
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    papel: string;
    nomeUsuario: string;
  }
}
