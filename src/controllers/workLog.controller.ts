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

  async listBiddersAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await workLogService.listBiddersForAdmin(req.user.id);
    res.json({ data });
  },

  async listFoldersAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await workLogService.listFoldersForAdmin(req.user.id, req.params.bidderId);
    res.json({ data });
  },

  async listFolderContentsAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await workLogService.listFolderContentsForAdmin(
      req.user.id,
      req.params.bidderId,
      req.params.date
    );
    res.json({ data });
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
