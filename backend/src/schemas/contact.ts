import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(200),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(5000),
});

export const contentRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  platform: z.string().min(1, "Platform is required").max(100),
});
