import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["SUPER_ADMIN", "CONTENT_MANAGER", "GAME_MANAGER"]),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(["SUPER_ADMIN", "CONTENT_MANAGER", "GAME_MANAGER"]).optional(),
  isActive: z.boolean().optional(),
});
