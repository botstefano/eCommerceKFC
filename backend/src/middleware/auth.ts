import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "No autorizado: token no proporcionado");
  }
  const token = header.replace("Bearer ", "");
  try {
    (req as any).user = verifyToken(token);
    next();
  } catch (err) {
    throw new ApiError(401, "No autorizado: token inválido o expirado");
  }
}

// Allows the request through with or without a token, attaching user if present.
// Useful for endpoints like recommendations that personalize for logged-in users
// but still work for guests.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      (req as any).user = verifyToken(header.replace("Bearer ", ""));
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!(req as any).user || (req as any).user.role !== "ADMIN") {
    throw new ApiError(403, "Acceso restringido a administradores");
  }
  next();
}
