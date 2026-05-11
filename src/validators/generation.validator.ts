import { z } from "zod";

export const createGenerationSchema = z.object({
  profileId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  label: z.string().trim().min(1, "Workspace is required").max(64),
  companyName: z.string().min(1).max(200),
  roleTitle: z.string().min(1).max(200),
  jobDescription: z.string().min(20),
  generateCoverLetter: z.boolean().optional().default(true),
});
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;

export const listGenerationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  profileId: z.string().uuid().optional(),
});

export const listWorkLogsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  bidderId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
