import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/AppError";
import { hashPassword } from "../utils/hash";
import { CreateBidderInput, UpdateBidderInput } from "../validators/bidder.validator";

export const bidderService = {
  async create(adminId: string, input: CreateBidderInput) {
    const exists = await userRepository.findByEmail(input.email);
    if (exists) throw AppError.conflict("Email already in use");
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: Role.BIDDER,
        adminId,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    return user;
  },

  async list(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const [rows, total] = await userRepository.listBidders(adminId, params);
    const data = rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      _count: r._count,
      lastActiveAt: r.workLogs?.[0]?.createdAt ?? null,
    }));
    return { data, total };
  },

  async getById(adminId: string, bidderId: string) {
    const bidder = await prisma.user.findFirst({
      where: { id: bidderId, role: Role.BIDDER, adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          include: { profile: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });
    if (!bidder) throw AppError.notFound("Bidder not found");
    return bidder;
  },

  async update(adminId: string, bidderId: string, input: UpdateBidderInput) {
    const bidder = await prisma.user.findFirst({
      where: { id: bidderId, role: Role.BIDDER, adminId },
    });
    if (!bidder) throw AppError.notFound("Bidder not found");

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.password) data.passwordHash = await hashPassword(input.password);

    const updated = await prisma.user.update({
      where: { id: bidderId },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
    });
    return updated;
  },

  async delete(adminId: string, bidderId: string) {
    const bidder = await prisma.user.findFirst({
      where: { id: bidderId, role: Role.BIDDER, adminId },
    });
    if (!bidder) throw AppError.notFound("Bidder not found");
    await prisma.user.delete({ where: { id: bidderId } });
  },
};
