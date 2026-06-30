import { Request, Response } from "express";
import { prisma } from "../config/database";
import { hashPassword, revokeAllUserTokens } from "../services/auth";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  return success(res, users);
}

export async function getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
  if (!user) return error(res, "User not found", 404);
  return success(res, user);
}

export async function createUser(req: Request, res: Response) {
  const { email, password, name, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return error(res, "Email already in use");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  await logAudit(req.userId!, "CREATE", "user", user.id, { email: user.email, role: user.role }, req.siteId);
  return success(res, user, 201);
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { password, ...data } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return error(res, "User not found", 404);

  const updateData: any = { ...data };
  if (password) {
    updateData.passwordHash = await hashPassword(password);
    // Revoke all tokens when password changes
    await revokeAllUserTokens(id);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  await logAudit(req.userId!, "UPDATE", "user", user.id, { email: user.email }, req.siteId);
  return success(res, user);
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;

  if (id === req.userId) return error(res, "Cannot delete your own account");

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return error(res, "User not found", 404);

  await prisma.user.delete({ where: { id } });
  await logAudit(req.userId!, "DELETE", "user", id, { email: existing.email }, req.siteId);

  return success(res, { message: "User deleted" });
}
