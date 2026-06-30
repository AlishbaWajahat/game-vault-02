import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { paginated } from "../utils/response";
import { Prisma, Role } from "@prisma/client";

export async function listAuditLogs(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as any);
  const { entity, action, userId } = req.query;

  const where: Prisma.AuditLogWhereInput = {};
  if (entity) where.entity = entity as string;
  if (action) where.action = action as string;
  if (userId) where.userId = userId as string;

  // Site scoping
  if (req.siteId) where.siteId = req.siteId;

  // Non-admin users only see their own activity
  if (req.userRole !== Role.SUPER_ADMIN) {
    where.userId = req.userId!;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(res, logs, total, page, limit);
}
