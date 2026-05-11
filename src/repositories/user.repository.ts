import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "../config/prisma";

export const userRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },
  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },
  delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
  listBidders(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const where: Prisma.UserWhereInput = {
      role: Role.BIDDER,
      adminId,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignments: true,
              generations: true,
            },
          },
          workLogs: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
  },
};
