import { z } from "zod";

export const createProfileSchema = z.object({
  fullName: z.string().min(1).max(160),
  linkedinUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  email: z.string().email(),
  phoneNumber: z.string().max(40).optional(),
  address: z.string().max(255).optional(),
  masterPrompt: z.string().min(20),
  defaultPdfTemplateId: z.string().uuid().optional(),
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = createProfileSchema.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const listProfileQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export const assignProfileSchema = z.object({
  bidderId: z.string().uuid(),
});
export type AssignProfileInput = z.infer<typeof assignProfileSchema>;
