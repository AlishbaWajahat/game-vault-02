import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success } from "../utils/response";

export async function listCategories(req: Request, res: Response) {
  const contentTypeSlug = req.query.type as string | undefined;

  const where: Record<string, unknown> = {};

  // Site scoping
  if (req.siteId) {
    where.sites = { some: { siteId: req.siteId } };
  }

  if (contentTypeSlug) {
    where.contentType = { slug: contentTypeSlug };
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: { contentType: { select: { id: true, slug: true, name: true } } },
  });
  return success(res, categories);
}
