import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { analyticsService } from "../services/analytics.service";

export const analyticsController = {
  async resumesPerDay(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const raw = Number((req.query.days as string | undefined) ?? 7);
    const days = Number.isFinite(raw) ? Math.min(90, Math.max(1, Math.floor(raw))) : 7;
    const data = await analyticsService.resumesPerDay(req.user.id, days);
    res.json({ data });
  },
};
