import { Request, Response } from "express";
import { templateService } from "../services/template.service";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";

export const templateController = {
  async create(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const tpl = await templateService.create(req.user.id, req.body);
    res.status(201).json({ data: tpl });
  },

  async list(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const q = req.query as any;
    const { data, total } = await templateService.listForAdmin(req.user.id, {
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
    });
    res.json(paginate(data, total, { page: q.page, pageSize: q.pageSize }));
  },

  async listAvailable(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await templateService.listAvailable(req.user.id);
    res.json({ data });
  },

  async get(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const tpl = await templateService.getById(req.user.id, req.params.id);
    res.json({ data: tpl });
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const tpl = await templateService.update(req.user.id, req.params.id, req.body);
    res.json({ data: tpl });
  },

  async delete(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    await templateService.delete(req.user.id, req.params.id);
    res.status(204).send();
  },

  async previewHtml(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const html = await templateService.previewHtml(req.user.id, req.params.id);
    res.type("html").send(html);
  },

  async previewPdf(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const pdf = await templateService.previewPdf(req.user.id, req.params.id);
    res.type("application/pdf").send(pdf);
  },
};
