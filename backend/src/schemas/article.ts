import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).optional(),
  body: z.string().min(1, "Body is required"),
  category: z.string().min(1, "Category is required"),
  date: z.string().optional(),
  author: z.string().optional(),
  excerpt: z.string().optional(),
  image: z.string().optional(),
  isPublished: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();
