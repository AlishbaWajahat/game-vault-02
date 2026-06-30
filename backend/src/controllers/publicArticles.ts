import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success, error } from "../utils/response";
import { Prisma } from "@prisma/client";

export async function listArticles(req: Request, res: Response) {
  const where: Prisma.ArticleWhereInput = { isPublished: true };

  if (req.siteId) {
    where.siteId = req.siteId;
  }

  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return success(res, articles);
}

export async function getArticle(req: Request, res: Response) {
  const { slug } = req.params;

  const article = await prisma.article.findUnique({ where: { slug } });

  if (!article || !article.isPublished) {
    return error(res, "Article not found", 404);
  }

  // Check article belongs to current site
  if (req.siteId && article.siteId && article.siteId !== req.siteId) {
    return error(res, "Article not found", 404);
  }

  return success(res, article);
}
