import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { BIDDER_PROFILE_SELECT, profileRepository } from "../repositories/profile.repository";
import { AppError } from "../utils/AppError";
import {
  CreateProfileInput,
  UpdateProfileInput,
} from "../validators/profile.validator";

export const profileService = {
  async create(adminId: string, input: CreateProfileInput) {
    if (input.defaultPdfTemplateId) {
      const tpl = await prisma.resumeTemplate.findFirst({
        where: { id: input.defaultPdfTemplateId, createdByAdminId: adminId },
      });
      if (!tpl) throw AppError.badRequest("Template not found or not owned by admin");
    }
    return prisma.profile.create({
      data: {
        fullName: input.fullName,
        linkedinUrl: input.linkedinUrl,
        email: input.email,
        phoneNumber: input.phoneNumber,
        address: input.address,
        masterPrompt: input.masterPrompt,
        defaultPdfTemplateId: input.defaultPdfTemplateId,
        aiProvider: input.aiProvider ?? null,
        aiModel: input.aiModel ?? null,
        createdByAdminId: adminId,
      },
    });
  },

  async listForAdmin(adminId: string, params: { page: number; pageSize: number; search?: string }) {
    const [data, total] = await profileRepository.listForAdmin(adminId, params);
    return { data, total };
  },

  async listForBidder(bidderId: string, params: { page: number; pageSize: number; search?: string }) {
    const [data, total] = await profileRepository.listForBidder(bidderId, params);
    return { data, total };
  },

  async getForAdmin(adminId: string, id: string) {
    const profile = await prisma.profile.findFirst({
      where: { id, createdByAdminId: adminId },
      include: {
        defaultPdfTemplate: true,
        assignments: {
          include: { bidder: { select: { id: true, name: true, email: true, isActive: true } } },
        },
      },
    });
    if (!profile) throw AppError.notFound("Profile not found");
    return profile;
  },

  async getForBidder(bidderId: string, id: string) {
    const profile = await prisma.profile.findFirst({
      where: { id, assignments: { some: { bidderId } } },
      select: BIDDER_PROFILE_SELECT,
    });
    if (!profile) throw AppError.notFound("Profile not found");
    return profile;
  },

  async update(adminId: string, id: string, input: UpdateProfileInput) {
    const existing = await prisma.profile.findFirst({
      where: { id, createdByAdminId: adminId },
    });
    if (!existing) throw AppError.notFound("Profile not found");

    if (input.defaultPdfTemplateId) {
      const tpl = await prisma.resumeTemplate.findFirst({
        where: { id: input.defaultPdfTemplateId, createdByAdminId: adminId },
      });
      if (!tpl) throw AppError.badRequest("Template not found or not owned by admin");
    }

    return prisma.profile.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.masterPrompt !== undefined ? { masterPrompt: input.masterPrompt } : {}),
        ...(input.defaultPdfTemplateId !== undefined
          ? { defaultPdfTemplateId: input.defaultPdfTemplateId }
          : {}),
        ...(input.aiProvider !== undefined ? { aiProvider: input.aiProvider } : {}),
        ...(input.aiModel !== undefined ? { aiModel: input.aiModel } : {}),
      },
    });
  },

  async delete(adminId: string, id: string) {
    const existing = await prisma.profile.findFirst({
      where: { id, createdByAdminId: adminId },
    });
    if (!existing) throw AppError.notFound("Profile not found");
    await prisma.profile.delete({ where: { id } });
  },

  async assign(adminId: string, profileId: string, bidderId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, createdByAdminId: adminId },
    });
    if (!profile) throw AppError.notFound("Profile not found");
    const bidder = await prisma.user.findFirst({
      where: { id: bidderId, role: Role.BIDDER, adminId },
    });
    if (!bidder) throw AppError.notFound("Bidder not found");

    return prisma.profileAssignment.upsert({
      where: { profileId_bidderId: { profileId, bidderId } },
      create: { profileId, bidderId, assignedById: adminId },
      update: {},
      include: { bidder: { select: { id: true, name: true, email: true } } },
    });
  },

  async unassign(adminId: string, profileId: string, bidderId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, createdByAdminId: adminId },
    });
    if (!profile) throw AppError.notFound("Profile not found");
    await prisma.profileAssignment.deleteMany({ where: { profileId, bidderId } });
  },

  async listAssignments(adminId: string, profileId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, createdByAdminId: adminId },
    });
    if (!profile) throw AppError.notFound("Profile not found");
    return prisma.profileAssignment.findMany({
      where: { profileId },
      include: { bidder: { select: { id: true, name: true, email: true, isActive: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
