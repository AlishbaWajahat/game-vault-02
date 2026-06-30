import { z } from "zod";

export const updateSettingSchema = z.object({
  value: z.string(),
});

export const bulkSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
      group: z.string().optional(),
    })
  ),
});
