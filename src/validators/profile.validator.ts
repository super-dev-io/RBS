import { z } from "zod";
import { AI_MODELS, AI_PROVIDERS } from "../services/ai/models";

export const createProfileSchema = z
  .object({
    fullName: z.string().min(1).max(160),
    linkedinUrl: z
      .string()
      .url()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    email: z.string().email(),
    phoneNumber: z.string().max(40).optional(),
    address: z.string().max(255).optional(),
    masterPrompt: z.string().min(20),
    defaultPdfTemplateId: z.string().uuid().optional(),
    aiProvider: z
      .enum(AI_PROVIDERS as unknown as [string, ...string[]])
      .nullable()
      .optional(),
    aiModel: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.aiProvider && val.aiModel) {
      const list = AI_MODELS[val.aiProvider as keyof typeof AI_MODELS] as readonly string[];
      if (!list.includes(val.aiModel)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aiModel"],
          message: `Model "${val.aiModel}" is not valid for provider "${val.aiProvider}"`,
        });
      }
    }
    if (val.aiProvider && !val.aiModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aiModel"],
        message: "aiModel is required when aiProvider is set",
      });
    }
    if (!val.aiProvider && val.aiModel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aiProvider"],
        message: "aiProvider is required when aiModel is set",
      });
    }
  });
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).max(160).optional(),
    linkedinUrl: z
      .string()
      .url()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    email: z.string().email().optional(),
    phoneNumber: z.string().max(40).optional(),
    address: z.string().max(255).optional(),
    masterPrompt: z.string().min(20).optional(),
    defaultPdfTemplateId: z.string().uuid().nullable().optional(),
    aiProvider: z
      .enum(AI_PROVIDERS as unknown as [string, ...string[]])
      .nullable()
      .optional(),
    aiModel: z.string().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.aiProvider && val.aiModel) {
      const list = AI_MODELS[val.aiProvider as keyof typeof AI_MODELS] as readonly string[];
      if (!list.includes(val.aiModel)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aiModel"],
          message: `Model "${val.aiModel}" is not valid for provider "${val.aiProvider}"`,
        });
      }
    }
  });
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
