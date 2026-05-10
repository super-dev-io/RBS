import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const templateRepository = {
  create(data: Prisma.ResumeTemplateCreateInput) {
    return prisma.resumeTemplate.create({ data });
  },
  update(id: string, data: Prisma.ResumeTemplateUpdateInput) {
    return prisma.resumeTemplate.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.resumeTemplate.delete({ where: { id } });
  },
  findById(id: string) {
    return prisma.resumeTemplate.findUnique({ where: { id } });
  },
  listForAdmin(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const where: Prisma.ResumeTemplateWhereInput = {
      createdByAdminId: adminId,
      ...(params.search
        ? { name: { contains: params.search, mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction([
      prisma.resumeTemplate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.resumeTemplate.count({ where }),
    ]);
  },
};
