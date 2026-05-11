import { Request, Response } from "express";
import { generationService } from "../services/generation.service";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/pagination";
import { renderCoverLetterPdf, renderResumePdf } from "../services/pdf.service";
import { sanitizeFilename } from "../services/storage/paths";
import { TemplateConfig } from "../services/templating/types";
import { ResumeContent } from "../services/ai";

function attachmentHeader(filename: string): string {
  const safe = sanitizeFilename(filename).replace(/"/g, "");
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

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

  async getMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForBidder(req.user.id, req.params.id);
    const { coverLetterContent, template, ...rest } = gen as any;
    res.json({
      data: {
        ...rest,
        coverLetterContent,
        template: template ? { id: template.id, name: template.name } : null,
        hasCoverLetter: coverLetterContent != null && coverLetterContent !== "",
      },
    });
  },

  async downloadMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForBidder(req.user.id, req.params.id);
    if (gen.status !== "COMPLETED" || !gen.generatedContent) {
      throw AppError.badRequest("Resume not ready yet");
    }
    const pdf = await renderResumePdf({
      config: gen.template.config as unknown as TemplateConfig,
      content: gen.generatedContent as unknown as ResumeContent,
    });
    const filename = `${gen.profile.fullName}.pdf`;
    res
      .type("application/pdf")
      .setHeader("Content-Disposition", attachmentHeader(filename))
      .send(pdf);
  },

  async downloadCoverLetterMine(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const gen = await generationService.getForBidder(req.user.id, req.params.id);
    if (gen.status !== "COMPLETED" || !gen.coverLetterContent || !gen.generatedContent) {
      throw AppError.notFound("Cover letter not available");
    }
    const pdf = await renderCoverLetterPdf({
      resume: gen.generatedContent as unknown as ResumeContent,
      coverLetterText: gen.coverLetterContent,
    });
    const filename = `${gen.profile.fullName} - Cover Letter.pdf`;
    res
      .type("application/pdf")
      .setHeader("Content-Disposition", attachmentHeader(filename))
      .send(pdf);
  },
};
