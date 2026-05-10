import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or invalid authorization header"));
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden("Insufficient permissions"));
    return next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);
export const requireBidder = requireRole(Role.BIDDER);
