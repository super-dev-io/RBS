import { z } from "zod";

export const createBidderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
});
export type CreateBidderInput = z.infer<typeof createBidderSchema>;

export const updateBidderSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
export type UpdateBidderInput = z.infer<typeof updateBidderSchema>;

export const listBidderQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
