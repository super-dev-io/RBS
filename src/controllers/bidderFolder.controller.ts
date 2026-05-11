import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { bidderFolderService } from "../services/bidderFolder.service";

export const bidderFolderController = {
  async create(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const label = typeof req.body?.label === "string" ? req.body.label : undefined;
    const folder = await bidderFolderService.ensureWorkspace(req.user.id, label);
    res.status(201).json({ data: folder });
  },

  async list(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await bidderFolderService.listForBidder(req.user.id);
    res.json({ data });
  },

  async listGenerations(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const data = await bidderFolderService.listGenerationsForWorkspace(
      req.user.id,
      decodeURIComponent(req.params.label)
    );
    res.json({ data });
  },
};
