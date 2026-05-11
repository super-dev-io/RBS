import { GenerationStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const generationRepository = {
  create(data: Prisma.ResumeGenerationCreateInput) {
    return prisma.resumeGeneration.create({ data });
  },

  update(id: string, data: Prisma.ResumeGenerationUpdateInput) {
    return prisma.resumeGeneration.update({ where: { id }, data });
  },

  findById(id: string) {
    return prisma.resumeGeneration.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, fullName: true, email: true } },
        template: { select: { id: true, name: true } },
        bidder: { select: { id: true, name: true, email: true } },
      },
    });
  },

  listForBidder(
    bidderId: string,
    params: { page: number; pageSize: number; status?: GenerationStatus; profileId?: string }
  ) {
    const where: Prisma.ResumeGenerationWhereInput = {
      bidderId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.profileId ? { profileId: params.profileId } : {}),
    };
    return prisma.$transaction([
      prisma.resumeGeneration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          profile: { select: { id: true, fullName: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      prisma.resumeGeneration.count({ where }),
    ]);
  },

};
