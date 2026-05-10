import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  htmlTemplate: z.string().min(20),
  cssStyles: z.string().min(0).default(""),
  thumbnailUrl: z.string().url().optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const listTemplateQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
