import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
