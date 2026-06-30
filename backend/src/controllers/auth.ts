import { Request, Response } from "express";
import { prisma } from "../config/database";
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/auth";
import { success, error } from "../utils/response";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return error(res, "Invalid credentials", 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return error(res, "Invalid credentials", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  return success(res, {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  const result = await rotateRefreshToken(refreshToken);
  if (!result) {
    return error(res, "Invalid or expired refresh token", 401);
  }

  return success(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return success(res, { message: "Logged out" });
}
