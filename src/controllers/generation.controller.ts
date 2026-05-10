import { Request, Response } from "express";
import { generationService } from "../services/generation.service";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";
import { getStorage } from "../services/storage";

export const generationController = {
  async create(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.createForBidder(req.user.id, req.body);
    res.status(202).json({ data: gen });
  },

  async listMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await generationService.listForBidder(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      profileId: q.profileId,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async listAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await generationService.listForAdmin(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      profileId: q.profileId,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async getMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForBidder(req.user.id, req.params.id);
    res.json({ data: gen });
  },

  async getAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForAdmin(req.user.id, req.params.id);
    res.json({ data: gen });
  },

  async downloadMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForBidder(req.user.id, req.params.id);
    if (!gen.pdfPath) throw AppError.badRequest("PDF not yet generated");
    const buf = await getStorage().read(gen.pdfPath);
    res
      .type("application/pdf")
      .setHeader("Content-Disposition", `attachment; filename="resume-${gen.id}.pdf"`)
      .send(buf);
  },

  async downloadAdmin(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForAdmin(req.user.id, req.params.id);
    if (!gen.pdfPath) throw AppError.badRequest("PDF not yet generated");
    const buf = await getStorage().read(gen.pdfPath);
    res
      .type("application/pdf")
      .setHeader("Content-Disposition", `attachment; filename="resume-${gen.id}.pdf"`)
      .send(buf);
  },
};
