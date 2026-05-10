import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { hashPassword, sha256, verifyPassword } from "../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

function refreshExpiresAt(): Date {
  const ms = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

function parseDuration(s: string): number {
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  return n * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
}

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw AppError.unauthorized("Invalid credentials");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw AppError.unauthorized("Invalid credentials");
    return this.issueTokens(user.id, user.email, user.role);
  },

  async issueTokens(userId: string, email: string, role: Role) {
    const tokenId = uuidv4();
    const refreshToken = signRefreshToken({ sub: userId, tokenId });
    const accessToken = signAccessToken({ sub: userId, email, role });

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: refreshExpiresAt(),
      },
    });

    return { accessToken, refreshToken, user: { id: userId, email, role } };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.tokenHash !== sha256(refreshToken) ||
      stored.revokedAt ||
      stored.expiresAt < new Date()
    ) {
      throw AppError.unauthorized("Refresh token revoked or expired");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw AppError.unauthorized("User no longer active");

    // Rotate
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  },

  async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* ignore */
    }
  },

  async hashPassword(p: string) {
    return hashPassword(p);
  },
};
