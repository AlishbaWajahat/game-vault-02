import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";

export async function listMessages(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as any);
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (req.siteId) where.siteId = req.siteId;

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.contactMessage.count({ where }),
  ]);

  return paginated(res, messages, total, page, limit);
}

export async function getMessage(req: Request, res: Response) {
  const message = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
  if (!message) return error(res, "Message not found", 404);

  // Mark as read if unread
  if (message.status === "UNREAD") {
    await prisma.contactMessage.update({ where: { id: message.id }, data: { status: "READ" } });
  }

  return success(res, message);
}

export async function updateMessageStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return error(res, "Message not found", 404);

  const message = await prisma.contactMessage.update({ where: { id }, data: { status } });
  await logAudit(req.userId!, "UPDATE", "contact_message", id, { status }, req.siteId);

  return success(res, message);
}

export async function deleteMessage(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return error(res, "Message not found", 404);

  await prisma.contactMessage.delete({ where: { id } });
  await logAudit(req.userId!, "DELETE", "contact_message", id, undefined, req.siteId);

  return success(res, { message: "Message deleted" });
}
