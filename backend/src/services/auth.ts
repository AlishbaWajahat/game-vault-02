import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/database";
import { env } from "../config/env";

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function rotateRefreshToken(oldToken: string) {
  const existing = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!existing || existing.expiresAt < new Date()) {
    if (existing) {
      await prisma.refreshToken.delete({ where: { id: existing.id } });
    }
    return null;
  }

  // Delete old token
  await prisma.refreshToken.delete({ where: { id: existing.id } });

  // Generate new tokens
  const accessToken = generateAccessToken(existing.user.id, existing.user.role);
  const refreshToken = await generateRefreshToken(existing.user.id);

  return { accessToken, refreshToken, user: existing.user };
}

export async function revokeRefreshToken(token: string) {
  try {
    await prisma.refreshToken.delete({ where: { token } });
  } catch {
    // Token may already be deleted
  }
}

export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
