import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeLabel(label: string | undefined | null): string {
  const trimmed = (label ?? "").trim();
  if (!trimmed) throw AppError.badRequest("Workspace name is required");
  if (trimmed.length > 64) {
    throw AppError.badRequest("Workspace name must be at most 64 characters");
  }
  return trimmed;
}

function utcDayBounds(d: Date): { from: Date; to: Date } {
  const from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export const bidderFolderService = {
  todayLabel,

  async ensureWorkspace(bidderId: string, rawLabel?: string) {
    const label = normalizeLabel(rawLabel ?? todayLabel());
    return prisma.bidderFolder.upsert({
      where: { bidderId_label: { bidderId, label } },
      create: { bidderId, label },
      update: {},
    });
  },

  async existsForBidder(bidderId: string, label: string): Promise<boolean> {
    const row = await prisma.bidderFolder.findUnique({
      where: { bidderId_label: { bidderId, label } },
      select: { id: true },
    });
    return !!row;
  },

  async listForBidder(bidderId: string) {
    const folders = await prisma.bidderFolder.findMany({
      where: { bidderId },
      orderBy: { createdAt: "desc" },
    });
    if (folders.length === 0) return [];

    // We don't store a folder reference on ResumeGeneration, so we approximate
    // membership by matching the UTC day of the generation's createdAt to the
    // folder's createdAt day. This mirrors the old date-keyed behavior.
    return Promise.all(
      folders.map(async (f) => {
        const { from, to } = utcDayBounds(f.createdAt);
        const generationCount = await prisma.resumeGeneration.count({
          where: { bidderId, createdAt: { gte: from, lt: to } },
        });
        return {
          label: f.label,
          createdAt: f.createdAt,
          generationCount,
        };
      })
    );
  },

  async listGenerationsForWorkspace(bidderId: string, rawLabel: string) {
    const label = normalizeLabel(rawLabel);
    const folder = await prisma.bidderFolder.findUnique({
      where: { bidderId_label: { bidderId, label } },
      select: { id: true, createdAt: true },
    });
    if (!folder) throw AppError.notFound("Workspace not found");

    const { from, to } = utcDayBounds(folder.createdAt);
    const rows = await prisma.resumeGeneration.findMany({
      where: { bidderId, createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        status: true,
        errorMessage: true,
        coverLetterContent: true,
        createdAt: true,
        completedAt: true,
        profile: { select: { id: true, fullName: true } },
        template: { select: { id: true, name: true } },
      },
    });

    return rows.map(({ coverLetterContent, ...r }) => ({
      ...r,
      hasCoverLetter: coverLetterContent != null && coverLetterContent !== "",
    }));
  },
};
