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
          generatedResume: { select: { id: true, status: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);
  },
  async listBiddersForAdmin(adminId: string) {
    const grouped = await prisma.workLog.groupBy({
      by: ["bidderId"],
      where: { profile: { createdByAdminId: adminId } },
      _count: { _all: true },
      _max: { createdAt: true },
    });
    if (grouped.length === 0) return [];
    const bidderIds = grouped.map((g) => g.bidderId);
    const bidders = await prisma.user.findMany({
      where: { id: { in: bidderIds } },
      select: { id: true, name: true, email: true },
    });
    const byId = new Map(bidders.map((b) => [b.id, b]));
    return grouped
      .map((g) => ({
        bidder: byId.get(g.bidderId)!,
        logCount: g._count._all,
        lastActivityAt: g._max.createdAt,
      }))
      .filter((row) => row.bidder)
      .sort((a, b) => (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0));
  },

  async listFoldersForAdmin(adminId: string, bidderId: string) {
    const logs = await prisma.workLog.findMany({
      where: { bidderId, profile: { createdByAdminId: adminId } },
      select: { createdAt: true },
    });
    const counts = new Map<string, number>();
    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  listFolderContentsForAdmin(
    adminId: string,
    bidderId: string,
    from: Date,
    to: Date
  ) {
    return prisma.workLog.findMany({
      where: {
        bidderId,
        profile: { createdByAdminId: adminId },
        createdAt: { gte: from, lt: to },
      },
      orderBy: { createdAt: "desc" },
      include: {
        bidder: { select: { id: true, name: true, email: true } },
        profile: { select: { id: true, fullName: true } },
        generatedResume: {
          select: {
            id: true,
            status: true,
            jobDescription: true,
            companyName: true,
            roleTitle: true,
            createdAt: true,
            completedAt: true,
            aiProvider: true,
            aiModel: true,
          },
        },
      },
    });
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
          generatedResume: { select: { id: true, status: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);
  },
};
