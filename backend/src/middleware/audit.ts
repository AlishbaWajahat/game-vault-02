import { prisma } from "../config/database";
import { Prisma } from "@prisma/client";

export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  siteId?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: (details ?? undefined) as Prisma.InputJsonValue | undefined,
        siteId: siteId || undefined,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}
