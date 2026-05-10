import { GenerationStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateGenerationInput } from "../validators/generation.validator";
import { getGenerationQueue } from "../queues/generation.queue";
import { getAiProvider } from "./ai";
import { renderResumePdf } from "./pdf.service";
import { getStorage } from "./storage";
import { logger } from "../utils/logger";
import { generationRepository } from "../repositories/generation.repository";

export const generationService = {
  async createForBidder(bidderId: string, input: CreateGenerationInput) {
    const profile = await prisma.profile.findFirst({
      where: { id: input.profileId, assignments: { some: { bidderId } } },
    });
    if (!profile) throw AppError.forbidden("Profile not assigned to you");

    const templateId = input.templateId ?? profile.defaultPdfTemplateId;
    if (!templateId) {
      throw AppError.badRequest(
        "No template specified and profile has no default template configured"
      );
    }

    const template = await prisma.resumeTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw AppError.notFound("Template not found");

    const generation = await prisma.$transaction(async (tx) => {
      const gen = await tx.resumeGeneration.create({
        data: {
          bidderId,
          profileId: input.profileId,
          templateId,
          companyName: input.companyName,
          roleTitle: input.roleTitle,
          jobDescription: input.jobDescription,
          status: GenerationStatus.PENDING,
        },
      });
      await tx.workLog.create({
        data: {
          bidderId,
          profileId: input.profileId,
          companyName: input.companyName,
          roleTitle: input.roleTitle,
          generationStatus: GenerationStatus.PENDING,
          generatedResumeId: gen.id,
        },
      });
      return gen;
    });

    const job = await getGenerationQueue().add(
      "generate",
      { generationId: generation.id },
      { jobId: generation.id }
    );

    await prisma.resumeGeneration.update({
      where: { id: generation.id },
      data: { jobId: job.id ?? null },
    });

    return generation;
  },

  async getForBidder(bidderId: string, id: string) {
    const gen = await prisma.resumeGeneration.findFirst({
      where: { id, bidderId },
      include: {
        profile: { select: { id: true, fullName: true, email: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!gen) throw AppError.notFound("Generation not found");
    return gen;
  },

  async getForAdmin(adminId: string, id: string) {
    const gen = await prisma.resumeGeneration.findFirst({
      where: { id, profile: { createdByAdminId: adminId } },
      include: {
        profile: { select: { id: true, fullName: true, email: true } },
        template: { select: { id: true, name: true } },
        bidder: { select: { id: true, name: true, email: true } },
      },
    });
    if (!gen) throw AppError.notFound("Generation not found");
    return gen;
  },

  async listForBidder(
    bidderId: string,
    params: { page: number; pageSize: number; status?: GenerationStatus; profileId?: string }
  ) {
    const [data, total] = await generationRepository.listForBidder(bidderId, params);
    return { data, total };
  },

  async listForAdmin(
    adminId: string,
    params: { page: number; pageSize: number; status?: GenerationStatus; profileId?: string }
  ) {
    const [data, total] = await generationRepository.listForAdmin(adminId, params);
    return { data, total };
  },

  /**
   * Worker entrypoint — runs the AI + PDF + storage pipeline for a single generation.
   */
  async processGeneration(generationId: string): Promise<void> {
    const generation = await prisma.resumeGeneration.findUnique({
      where: { id: generationId },
      include: { profile: true, template: true, bidder: true },
    });
    if (!generation) {
      logger.warn({ generationId }, "Generation not found, skipping");
      return;
    }
    if (generation.bidder.role !== Role.BIDDER) {
      throw AppError.badRequest("Owner is not a bidder");
    }

    await prisma.$transaction([
      prisma.resumeGeneration.update({
        where: { id: generationId },
        data: { status: GenerationStatus.PROCESSING },
      }),
      prisma.workLog.updateMany({
        where: { generatedResumeId: generationId },
        data: { generationStatus: GenerationStatus.PROCESSING },
      }),
    ]);

    try {
      const ai = getAiProvider();
      const result = await ai.generate({
        masterPrompt: generation.profile.masterPrompt,
        candidate: {
          fullName: generation.profile.fullName,
          email: generation.profile.email,
          phoneNumber: generation.profile.phoneNumber ?? undefined,
          linkedinUrl: generation.profile.linkedinUrl ?? undefined,
          address: generation.profile.address ?? undefined,
        },
        job: {
          companyName: generation.companyName,
          roleTitle: generation.roleTitle,
          jobDescription: generation.jobDescription,
        },
      });

      const pdf = await renderResumePdf({
        htmlTemplate: generation.template.htmlTemplate,
        cssStyles: generation.template.cssStyles,
        content: result.content,
      });

      const storage = getStorage();
      const key = `resumes/${generationId}.pdf`;
      const stored = await storage.save({
        key,
        body: pdf,
        contentType: "application/pdf",
      });

      const completedAt = new Date();
      await prisma.$transaction([
        prisma.resumeGeneration.update({
          where: { id: generationId },
          data: {
            status: GenerationStatus.COMPLETED,
            generatedContent: result.content as any,
            aiProvider: result.provider,
            aiModel: result.model,
            pdfPath: stored.key,
            pdfUrl: stored.url,
            completedAt,
          },
        }),
        prisma.workLog.updateMany({
          where: { generatedResumeId: generationId },
          data: { generationStatus: GenerationStatus.COMPLETED, completedAt },
        }),
      ]);
      logger.info({ generationId }, "Generation completed");
    } catch (err: any) {
      const message = err?.message ?? "Unknown error";
      logger.error({ err, generationId }, "Generation failed");
      await prisma.$transaction([
        prisma.resumeGeneration.update({
          where: { id: generationId },
          data: {
            status: GenerationStatus.FAILED,
            errorMessage: message,
            completedAt: new Date(),
          },
        }),
        prisma.workLog.updateMany({
          where: { generatedResumeId: generationId },
          data: { generationStatus: GenerationStatus.FAILED, completedAt: new Date() },
        }),
      ]);
      throw err;
    }
  },
};
