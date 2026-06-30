import { z } from "zod";

export const createContentSchema = z.object({
  contentTypeId: z.string().min(1, "Content type is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).optional(),
  coverImage: z.string().optional().default(""),
  description: z.string().optional(),
  fields: z.record(z.unknown()).optional().default({}),
  downloads: z.number().int().min(0).optional(),
  popularity: z.number().int().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  platformIds: z.array(z.string()).optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const contentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  platform: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  // Dynamic field filters passed as filter[fieldSlug]=value
}).passthrough();
