import { Request, Response } from "express";
import { prisma } from "../config/database";
import { generateSlug } from "../utils/slug";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { revalidatePaths } from "../lib/revalidate";

export async function listCategories(req: Request, res: Response) {
  const contentTypeId = req.query.contentTypeId as string | undefined;
  const includeGeneral = req.query.includeGeneral === "true";

  const where: Record<string, unknown> = {};

  // Site scoping
  if (req.siteId) {
    where.sites = { some: { siteId: req.siteId } };
  }

  if (contentTypeId) {
    if (includeGeneral) {
      where.OR = [{ contentTypeId }, { contentTypeId: null }];
    } else {
      where.contentTypeId = contentTypeId;
    }
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: { contentType: { select: { id: true, slug: true, name: true } } },
  });
  return success(res, categories);
}

export async function createCategory(req: Request, res: Response) {
  const data = req.body;
  const slug = data.slug || generateSlug(data.name);

  const existing = await prisma.category.findUnique({
    where: { slug },
    include: {
      sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
    },
  });

  if (existing) {
    // Check if already on the current site
    const onCurrentSite = req.siteId && existing.sites.some((s) => s.siteId === req.siteId);
    if (onCurrentSite) {
      return error(res, "Category with this slug already exists on this site");
    }

    // Exists in shared DB but not on current site — offer to link
    return res.status(409).json({
      success: false,
      error: "Category with this slug exists in the shared database",
      code: "DUPLICATE_IN_SHARED_DB",
      existingCategory: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        sites: existing.sites.map((s) => s.site.name),
      },
    });
  }

  const category = await prisma.category.create({
    data: {
      ...data,
      slug,
      // Auto-assign to current site
      sites: req.siteId
        ? { create: { siteId: req.siteId } }
        : undefined,
    },
  });
  await logAudit(req.userId!, "CREATE", "category", category.id, { name: category.name }, req.siteId);
  revalidatePaths([`/`], ["categories"]);

  return success(res, category, 201);
}

export async function updateCategory(req: Request, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return error(res, "Category not found", 404);

  const category = await prisma.category.update({ where: { id }, data: req.body });
  await logAudit(req.userId!, "UPDATE", "category", category.id, { name: category.name }, req.siteId);
  revalidatePaths([`/`], ["categories"]);

  return success(res, category);
}

export async function deleteCategory(req: Request, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { sites: true } } },
  });
  if (!existing) return error(res, "Category not found", 404);

  if (req.siteId) {
    // Unlink from current site
    const link = await prisma.categorySite.findUnique({
      where: { categoryId_siteId: { categoryId: id, siteId: req.siteId } },
    });
    if (!link) return error(res, "Category is not on this site", 404);

    await prisma.categorySite.delete({
      where: { categoryId_siteId: { categoryId: id, siteId: req.siteId } },
    });

    // If no remaining site links, truly delete
    const remaining = await prisma.categorySite.count({ where: { categoryId: id } });
    if (remaining === 0) {
      await prisma.category.delete({ where: { id } });
      await logAudit(req.userId!, "DELETE", "category", id, { name: existing.name }, req.siteId);
    } else {
      await logAudit(req.userId!, "UNASSIGN", "category", id, { name: existing.name }, req.siteId);
    }
  } else {
    await prisma.category.delete({ where: { id } });
    await logAudit(req.userId!, "DELETE", "category", id, { name: existing.name }, req.siteId);
  }

  revalidatePaths([`/`], ["categories"]);
  return success(res, { message: "Category removed" });
}

// ── Multi-Site: Assign / Unassign / Shared ──

export async function assignCategoryToSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const category = await prisma.category.findUnique({ where: { id: id as string } });
  if (!category) return error(res, "Category not found", 404);

  const existing = await prisma.categorySite.findUnique({
    where: { categoryId_siteId: { categoryId: id as string, siteId: req.siteId } },
  });
  if (existing) return error(res, "Category is already on this site");

  await prisma.categorySite.create({
    data: { categoryId: id as string, siteId: req.siteId },
  });

  await logAudit(req.userId!, "ASSIGN", "category", id as string, { name: category.name }, req.siteId);

  return success(res, { message: "Category added to this site" }, 201);
}

export async function unassignCategoryFromSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const category = await prisma.category.findUnique({
    where: { id: id as string },
    include: { _count: { select: { sites: true } } },
  });
  if (!category) return error(res, "Category not found", 404);

  const link = await prisma.categorySite.findUnique({
    where: { categoryId_siteId: { categoryId: id as string, siteId: req.siteId } },
  });
  if (!link) return error(res, "Category is not on this site", 404);

  await prisma.categorySite.delete({
    where: { categoryId_siteId: { categoryId: id as string, siteId: req.siteId } },
  });

  await logAudit(req.userId!, "UNASSIGN", "category", id as string, { name: category.name }, req.siteId);

  return success(res, { message: "Category removed from this site" });
}

export async function listSharedCategories(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where = req.siteId
    ? { sites: { none: { siteId: req.siteId } } }
    : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        contentType: { select: { id: true, slug: true, name: true } },
        sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  const mapped = categories.map((c) => ({
    ...c,
    siteNames: c.sites.map((s) => s.site.name),
    sites: undefined,
  }));

  return paginated(res, mapped, total, page, limit);
}
