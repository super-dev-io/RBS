import { Request, Response } from "express";
import { profileService } from "../services/profile.service";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";

export const profileController = {
  async create(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const profile = await profileService.create(req.user.id, req.body);
    res.status(201).json({ data: profile });
  },

  async listAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await profileService.listForAdmin(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async listMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await profileService.listForBidder(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async getAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const profile = await profileService.getForAdmin(req.user.id, req.params.id);
    res.json({ data: profile });
  },

  async getMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const profile = await profileService.getForBidder(req.user.id, req.params.id);
    res.json({ data: profile });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const profile = await profileService.update(req.user.id, req.params.id, req.body);
    res.json({ data: profile });
  },

  async delete(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    await profileService.delete(req.user.id, req.params.id);
    res.status(204).send();
  },

  async assign(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const assignment = await profileService.assign(
      req.user.id,
      req.params.id,
      req.body.bidderId
    );
    res.status(201).json({ data: assignment });
  },

  async unassign(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    await profileService.unassign(req.user.id, req.params.id, req.params.bidderId);
    res.status(204).send();
  },

  async listAssignments(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await profileService.listAssignments(req.user.id, req.params.id);
    res.json({ data });
  },
};
