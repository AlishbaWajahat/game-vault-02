import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { generateSlug } from "../utils/slug";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";
import sanitizeHtml from "sanitize-html";
import { revalidatePaths } from "../lib/revalidate";

export async function listArticles(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as any);

  const where = req.siteId ? { siteId: req.siteId } : {};

  const [articles, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.article.count({ where }),
  ]);

  return paginated(res, articles, total, page, limit);
}

export async function getArticle(req: Request, res: Response) {
  const article = await prisma.article.findUnique({ where: { id: req.params.id } });
  if (!article) return error(res, "Article not found", 404);
  return success(res, article);
}

export async function createArticle(req: Request, res: Response) {
  const { body, ...data } = req.body;
  const slug = data.slug || generateSlug(data.title);

  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) return error(res, "Article with this slug already exists");

  const article = await prisma.article.create({
    data: {
      ...data,
      slug,
      body: sanitizeHtml(body),
      siteId: req.siteId || undefined,
    },
  });

  await logAudit(req.userId!, "CREATE", "article", article.id, { title: article.title }, req.siteId);
  revalidatePaths([`/articles/${slug}`, `/articles`, `/`], ["articles", `article-${slug}`]);
  return success(res, article, 201);
}

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const { body, ...data } = req.body;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return error(res, "Article not found", 404);

  const article = await prisma.article.update({
    where: { id },
    data: { ...data, ...(body !== undefined ? { body: sanitizeHtml(body) } : {}) },
  });

  await logAudit(req.userId!, "UPDATE", "article", article.id, { title: article.title }, req.siteId);
  revalidatePaths([`/articles/${article.slug}`, `/articles`, `/`], ["articles", `article-${article.slug}`]);
  return success(res, article);
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return error(res, "Article not found", 404);

  // Verify article belongs to current site
  if (req.siteId && existing.siteId !== req.siteId) {
    return error(res, "Article not found on this site", 404);
  }

  await prisma.article.delete({ where: { id } });
  await logAudit(req.userId!, "DELETE", "article", id, { title: existing.title }, req.siteId);
  revalidatePaths([`/articles/${existing.slug}`, `/articles`, `/`], ["articles", `article-${existing.slug}`]);

  return success(res, { message: "Article deleted" });
}
