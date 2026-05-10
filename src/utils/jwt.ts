import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: "refresh";
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
}
