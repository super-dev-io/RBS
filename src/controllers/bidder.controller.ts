import { Request, Response } from "express";
import { bidderService } from "../services/bidder.service";
import { paginate } from "../utils/pagination";
import { AppError } from "../utils/AppError";

export const bidderController = {
  async create(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const bidder = await bidderService.create(req.user.id, req.body);
    res.status(201).json({ data: bidder });
  },

  async list(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await bidderService.list(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async getById(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const bidder = await bidderService.getById(req.user.id, req.params.id);
    res.json({ data: bidder });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const bidder = await bidderService.update(req.user.id, req.params.id, req.body);
    res.json({ data: bidder });
  },

  async delete(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    await bidderService.delete(req.user.id, req.params.id);
    res.status(204).send();
  },
};
