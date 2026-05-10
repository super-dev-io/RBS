import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  },

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  },

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) throw AppError.notFound("User not found");
    res.json({ user });
  },
};
