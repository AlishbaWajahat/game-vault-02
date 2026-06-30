import { z } from "zod";

export const createContentTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateContentTypeSchema = createContentTypeSchema.partial();

export const createFieldSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  fieldType: z.enum([
    "TEXT", "TEXTAREA", "RICH_TEXT", "NUMBER", "BOOLEAN", "URL",
    "IMAGE", "IMAGE_ARRAY", "TEXT_ARRAY", "SELECT", "MULTI_SELECT", "RATING", "DATE",
  ]),
  isRequired: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  group: z.string().optional(),
  showInList: z.boolean().optional(),
  showInDetail: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  isSortable: z.boolean().optional(),
  validation: z.record(z.unknown()).optional(),
});

export const updateFieldSchema = createFieldSchema.partial();
