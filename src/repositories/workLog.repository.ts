import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const workLogRepository = {
  create(data: Prisma.WorkLogCreateInput) {
    return prisma.workLog.create({ data });
  },
  update(id: string, data: Prisma.WorkLogUpdateInput) {
    return prisma.workLog.update({ where: { id }, data });
  },
  listForAdmin(
    adminId: string,
    params: {
      page: number;
      pageSize: number;
      bidderId?: string;
      from?: Date;
      to?: Date;
    }
  ) {
    const where: Prisma.WorkLogWhereInput = {
      profile: { createdByAdminId: adminId },
      ...(params.bidderId ? { bidderId: params.bidderId } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lt: params.to } : {}),
            },
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.workLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          bidder: { select: { id: true, name: true, email: true } },
          profile: { select: { id: true, fullName: true } },
          generatedResume: { select: { id: true, pdfUrl: true, status: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);
  },
  listForBidder(
    bidderId: string,
    params: { page: number; pageSize: number; from?: Date; to?: Date }
  ) {
    const where: Prisma.WorkLogWhereInput = {
      bidderId,
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lt: params.to } : {}),
            },
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.workLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          profile: { select: { id: true, fullName: true } },
          generatedResume: { select: { id: true, pdfUrl: true, status: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);
  },
};
