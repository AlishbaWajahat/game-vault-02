import { z } from "zod";

export const createPlatformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  classic: z.boolean().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
  contentTypeIds: z.array(z.string()).optional(),
});

export const updatePlatformSchema = createPlatformSchema.partial();
