import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";

export async function listRequests(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
  const status = req.query.status as string | undefined;
  const contentTypeId = req.query.contentTypeId as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (contentTypeId) where.contentTypeId = contentTypeId;
  if (req.siteId) where.siteId = req.siteId;

  const [requests, total] = await Promise.all([
    prisma.contentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { contentType: { select: { id: true, slug: true, name: true } } },
    }),
    prisma.contentRequest.count({ where }),
  ]);

  return paginated(res, requests, total, page, limit);
}

export async function updateRequestStatus(req: Request, res: Response) {
  const id = req.params.id as string;
  const { status, contentTypeId } = req.body;

  const existing = await prisma.contentRequest.findUnique({ where: { id } });
  if (!existing) return error(res, "Request not found", 404);

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (contentTypeId !== undefined) data.contentTypeId = contentTypeId || null;

  const request = await prisma.contentRequest.update({
    where: { id },
    data,
    include: { contentType: { select: { id: true, slug: true, name: true } } },
  });
  await logAudit(req.userId!, "UPDATE", "content_request", id, { status: request.status }, req.siteId);

  return success(res, request);
}
