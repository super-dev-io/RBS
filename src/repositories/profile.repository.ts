import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const profileRepository = {
  create(data: Prisma.ProfileCreateInput) {
    return prisma.profile.create({ data });
  },

  update(id: string, data: Prisma.ProfileUpdateInput) {
    return prisma.profile.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.profile.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.profile.findUnique({
      where: { id },
      include: { defaultPdfTemplate: true, assignments: { include: { bidder: true } } },
    });
  },

  listForAdmin(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const where: Prisma.ProfileWhereInput = {
      createdByAdminId: adminId,
      ...(params.search
        ? {
            OR: [
              { fullName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          defaultPdfTemplate: { select: { id: true, name: true } },
          _count: { select: { assignments: true, generations: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);
  },

  listForBidder(bidderId: string, params: { page: number; pageSize: number; search?: string }) {
    const where: Prisma.ProfileWhereInput = {
      assignments: { some: { bidderId } },
      ...(params.search
        ? {
            OR: [
              { fullName: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          defaultPdfTemplate: { select: { id: true, name: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);
  },
};
