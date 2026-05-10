import { prisma } from "../config/prisma";

export const assignmentRepository = {
  create(profileId: string, bidderId: string, assignedById: string) {
    return prisma.profileAssignment.create({
      data: { profileId, bidderId, assignedById },
      include: { bidder: { select: { id: true, name: true, email: true } } },
    });
  },

  delete(profileId: string, bidderId: string) {
    return prisma.profileAssignment.deleteMany({
      where: { profileId, bidderId },
    });
  },

  exists(profileId: string, bidderId: string) {
    return prisma.profileAssignment.findUnique({
      where: { profileId_bidderId: { profileId, bidderId } },
    });
  },

  listForProfile(profileId: string) {
    return prisma.profileAssignment.findMany({
      where: { profileId },
      include: { bidder: { select: { id: true, name: true, email: true, isActive: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
