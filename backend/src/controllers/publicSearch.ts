import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success } from "../utils/response";
import { Prisma } from "@prisma/client";

export async function search(req: Request, res: Response) {
  const q = (req.query.q as string) || "";

  if (!q.trim()) {
    return success(res, { content: [], articles: [] });
  }

  const contentWhere: Prisma.ContentWhereInput = {
    isPublished: true,
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  };

  // Site scoping
  if (req.siteId) {
    contentWhere.sites = { some: { siteId: req.siteId } };
  }

  const [content, articles] = await Promise.all([
    prisma.content.findMany({
      where: contentWhere,
      orderBy: { popularity: "desc" },
      take: 20,
      include: {
        contentType: { select: { slug: true, name: true } },
        platforms: { include: { platform: true } },
      },
    }),
    prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const mappedContent = content.map((c) => ({
    ...c,
    platform: c.platforms.map((p) => p.platform.name),
    platforms: undefined,
  }));

  return success(res, { content: mappedContent, articles });
}
