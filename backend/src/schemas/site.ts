import { z } from "zod";

export const createSiteSchema = z.object({
  siteId: z.string().min(1, "Site ID is required"),
  name: z.string().min(1, "Name is required"),
  domain: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateSiteSchema = createSiteSchema.partial();
