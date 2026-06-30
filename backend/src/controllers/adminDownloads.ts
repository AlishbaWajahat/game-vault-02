import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { success, paginated } from "../utils/response";
import { Prisma } from "@prisma/client";

export async function getDownloadStats(req: Request, res: Response) {
  const siteWhere: Prisma.DownloadLogWhereInput = req.siteId ? { siteId: req.siteId } : {};

  const [total, last7d, last30d] = await Promise.all([
    prisma.downloadLog.count({ where: siteWhere }),
    prisma.downloadLog.count({
      where: { ...siteWhere, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.downloadLog.count({
      where: { ...siteWhere, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Top downloaded content (scoped to site)
  const contentWhere = req.siteId ? { sites: { some: { siteId: req.siteId } } } : {};
  const topContent = await prisma.content.findMany({
    where: contentWhere,
    orderBy: { downloads: "desc" },
    take: 10,
    select: {
      id: true, title: true, slug: true, downloads: true,
      contentType: { select: { id: true, slug: true, name: true } },
    },
  });

  return success(res, { total, last7d, last30d, topContent });
}

export async function listDownloadLogs(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as any);
  const contentId = req.query.contentId as string | undefined;

  const where: Prisma.DownloadLogWhereInput = {};
  if (contentId) where.contentId = contentId;
  if (req.siteId) where.siteId = req.siteId;

  const [logs, total] = await Promise.all([
    prisma.downloadLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { content: { select: { title: true, slug: true } } },
    }),
    prisma.downloadLog.count({ where }),
  ]);

  return paginated(res, logs, total, page, limit);
}
