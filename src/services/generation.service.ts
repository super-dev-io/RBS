import { GenerationStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateGenerationInput } from "../validators/generation.validator";
import { getGenerationQueue } from "../queues/generation.queue";
import { getAiProvider, resolveProviderAndModel } from "./ai";
import { logger } from "../utils/logger";
import { generationRepository } from "../repositories/generation.repository";

export const generationService = {
  async createForBidder(bidderId: string, input: CreateGenerationInput) {
    const folder = await prisma.bidderFolder.findUnique({
      where: { bidderId_label: { bidderId, label: input.label } },
      select: { id: true },
    });
    if (!folder) {
      throw AppError.badRequest(
        "Create a date workspace first before generating resumes"
      );
    }

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

    const template = await prisma.resumeTemplate.findFirst({
      where: { id: templateId, createdByAdminId: profile.createdByAdminId },
    });
    if (!template) throw AppError.notFound("Template not found");

    const resolved = resolveProviderAndModel({
      provider: profile.aiProvider,
      model: profile.aiModel,
    });

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
          aiProvider: resolved.provider,
          aiModel: resolved.model,
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
      {
        generationId: generation.id,
        generateCoverLetter: input.generateCoverLetter ?? true,
      },
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
        template: { select: { id: true, name: true, config: true } },
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

  /**
   * Worker entrypoint — runs the AI pipeline for a single generation. PDFs are
   * no longer rendered or stored here; they are produced on demand by the
   * download endpoints from `generatedContent` / `coverLetterContent`.
   */
  async processGeneration(
    generationId: string,
    opts: { generateCoverLetter?: boolean } = {}
  ): Promise<void> {
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
      const ai = getAiProvider({
        provider: generation.aiProvider ?? generation.profile.aiProvider,
        model: generation.aiModel ?? generation.profile.aiModel,
      });
      const aiStart = Date.now();
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
      logger.info({ generationId, ms: Date.now() - aiStart }, "AI generation done");

      let coverLetterText: string | null = null;
      if (opts.generateCoverLetter !== false) {
        try {
          const clStart = Date.now();
          const cl = await ai.generateCoverLetter({
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
            resume: result.content,
          });
          coverLetterText = cl.content.text;
          logger.info(
            { generationId, ms: Date.now() - clStart },
            "Cover letter generated"
          );
        } catch (clErr) {
          logger.error(
            { err: clErr, generationId },
            "Cover letter generation failed (resume still succeeds)"
          );
        }
      }

      const completedAt = new Date();
      await prisma.$transaction([
        prisma.resumeGeneration.update({
          where: { id: generationId },
          data: {
            status: GenerationStatus.COMPLETED,
            generatedContent: result.content as any,
            aiProvider: result.provider,
            aiModel: result.model,
            coverLetterContent: coverLetterText,
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
