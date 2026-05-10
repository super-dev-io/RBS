import { Request, Response } from "express";
import { workLogService } from "../services/workLog.service";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";

export const workLogController = {
  async listAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await workLogService.listForAdmin(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      bidderId: q.bidderId,
      date: q.date,
      from: q.from,
      to: q.to,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async listMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await workLogService.listForBidder(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      date: q.date,
      from: q.from,
      to: q.to,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },
};
