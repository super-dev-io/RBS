import { z } from "zod";
import { ALL_BLOCK_KINDS } from "../services/templating/types";

const blockKindSchema = z.enum(ALL_BLOCK_KINDS as [string, ...string[]]);

const blockHeadingStyleSchema = z
  .object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    uppercase: z.boolean().optional(),
  })
  .strict();

const blockStyleSchema = z
  .object({
    fontSize: z.number().min(8).max(24).optional(),
    textColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2563eb")
      .optional(),
    alignment: z.enum(["left", "center", "right", "justify"]).optional(),
    headingStyle: blockHeadingStyleSchema.optional(),
  })
  .strict();

const blockConfigSchema = z.object({
  kind: blockKindSchema,
  enabled: z.boolean(),
  order: z.number().int().min(0).max(100),
  style: blockStyleSchema.optional(),
});

const themeConfigSchema = z.object({
  fontFamily: z.enum(["Inter", "Lora", "Source Sans", "Playfair"]),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2563eb"),
  baseFontSize: z.number().int().min(9).max(13),
  density: z.enum(["compact", "normal", "relaxed"]),
  layout: z.enum(["one-col", "two-col"]),
  timeline: z.boolean().optional(),
});

export const templateConfigSchema = z.object({
  blocks: z
    .array(blockConfigSchema)
    .min(1)
    .superRefine((blocks, ctx) => {
      const kinds = new Set<string>();
      for (const b of blocks) {
        if (kinds.has(b.kind)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate block kind: ${b.kind}`,
          });
          return;
        }
        kinds.add(b.kind);
      }
    }),
  theme: themeConfigSchema,
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  config: templateConfigSchema,
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
