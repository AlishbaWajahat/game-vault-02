import { Request, Response } from "express";
import { prisma } from "../config/database";
import { generateSlug } from "../utils/slug";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { revalidatePaths } from "../lib/revalidate";

export async function listPlatforms(req: Request, res: Response) {
  const platforms = await prisma.platform.findMany({
    where: req.siteId ? { sites: { some: { siteId: req.siteId } } } : {},
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { contents: true } },
      contentTypes: { include: { contentType: { select: { id: true, slug: true, name: true } } } },
    },
  });

  const mapped = platforms.map((p) => ({
    ...p,
    count: p._count.contents,
    contentTypes: p.contentTypes.map((ct) => ct.contentType),
    _count: undefined,
  }));

  return success(res, mapped);
}

export async function createPlatform(req: Request, res: Response) {
  const { contentTypeIds, ...data } = req.body;
  const slug = data.slug || generateSlug(data.name);

  const existing = await prisma.platform.findUnique({
    where: { slug },
    include: {
      sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
    },
  });

  if (existing) {
    // Check if already on the current site
    const onCurrentSite = req.siteId && existing.sites.some((s) => s.siteId === req.siteId);
    if (onCurrentSite) {
      return error(res, "Platform with this slug already exists on this site");
    }

    // Exists in shared DB but not on current site — offer to link
    return res.status(409).json({
      success: false,
      error: "Platform with this slug exists in the shared database",
      code: "DUPLICATE_IN_SHARED_DB",
      existingPlatform: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        sites: existing.sites.map((s) => s.site.name),
      },
    });
  }

  const platform = await prisma.platform.create({
    data: {
      name: data.name, slug, classic: data.classic, icon: data.icon, color: data.color, sortOrder: data.sortOrder,
      contentTypes: contentTypeIds?.length
        ? { create: contentTypeIds.map((ctId: string) => ({ contentTypeId: ctId })) }
        : undefined,
      // Auto-assign to current site
      sites: req.siteId
        ? { create: { siteId: req.siteId } }
        : undefined,
    },
  });
  await logAudit(req.userId!, "CREATE", "platform", platform.id, { name: platform.name }, req.siteId);
  revalidatePaths([`/platforms/${slug}`, `/platforms`, `/`], ["platforms", `platform-${slug}`]);

  return success(res, platform, 201);
}

export async function updatePlatform(req: Request, res: Response) {
  const id = req.params.id as string;
  const { contentTypeIds, ...data } = req.body;

  const platform = await prisma.$transaction(async (tx) => {
    const existing = await tx.platform.findUnique({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");

    if (contentTypeIds !== undefined) {
      await tx.platformContentType.deleteMany({ where: { platformId: id } });
      if (contentTypeIds.length > 0) {
        await tx.platformContentType.createMany({
          data: contentTypeIds.map((ctId: string) => ({ platformId: id, contentTypeId: ctId })),
        });
      }
    }

    return tx.platform.update({
      where: { id },
      data,
      include: {
        _count: { select: { contents: true } },
        contentTypes: { include: { contentType: { select: { id: true, slug: true, name: true } } } },
      },
    });
  }).catch((err) => {
    if (err.message === "NOT_FOUND") return null;
    throw err;
  });

  if (!platform) return error(res, "Platform not found", 404);

  const mapped = {
    ...platform,
    count: platform._count.contents,
    contentTypes: platform.contentTypes.map((ct) => ct.contentType),
    _count: undefined,
  };

  await logAudit(req.userId!, "UPDATE", "platform", id, { name: platform.name }, req.siteId);
  revalidatePaths([`/platforms/${platform.slug}`, `/platforms`, `/`], ["platforms", `platform-${platform.slug}`]);
  return success(res, mapped);
}

export async function deletePlatform(req: Request, res: Response) {
  const id = req.params.id as string;

  const existing = await prisma.platform.findUnique({
    where: { id },
    include: { _count: { select: { sites: true } } },
  });
  if (!existing) return error(res, "Platform not found", 404);

  if (req.siteId) {
    // Unlink from current site
    const link = await prisma.platformSite.findUnique({
      where: { platformId_siteId: { platformId: id, siteId: req.siteId } },
    });
    if (!link) return error(res, "Platform is not on this site", 404);

    await prisma.platformSite.delete({
      where: { platformId_siteId: { platformId: id, siteId: req.siteId } },
    });

    // If no remaining site links, truly delete the platform
    const remaining = await prisma.platformSite.count({ where: { platformId: id } });
    if (remaining === 0) {
      await prisma.platform.delete({ where: { id } });
      await logAudit(req.userId!, "DELETE", "platform", id, { name: existing.name }, req.siteId);
    } else {
      await logAudit(req.userId!, "UNASSIGN", "platform", id, { name: existing.name }, req.siteId);
    }
  } else {
    await prisma.platform.delete({ where: { id } });
    await logAudit(req.userId!, "DELETE", "platform", id, { name: existing.name }, req.siteId);
  }

  revalidatePaths([`/platforms/${existing.slug}`, `/platforms`, `/`], ["platforms", `platform-${existing.slug}`]);
  return success(res, { message: "Platform removed" });
}

// ── Multi-Site: Assign / Unassign / Shared ──

export async function assignPlatformToSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const platform = await prisma.platform.findUnique({ where: { id: id as string } });
  if (!platform) return error(res, "Platform not found", 404);

  const existing = await prisma.platformSite.findUnique({
    where: { platformId_siteId: { platformId: id as string, siteId: req.siteId } },
  });
  if (existing) return error(res, "Platform is already on this site");

  await prisma.platformSite.create({
    data: { platformId: id as string, siteId: req.siteId },
  });

  await logAudit(req.userId!, "ASSIGN", "platform", id as string, { name: platform.name }, req.siteId);

  return success(res, { message: "Platform added to this site" }, 201);
}

export async function unassignPlatformFromSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const platform = await prisma.platform.findUnique({
    where: { id: id as string },
    include: { _count: { select: { sites: true } } },
  });
  if (!platform) return error(res, "Platform not found", 404);

  const link = await prisma.platformSite.findUnique({
    where: { platformId_siteId: { platformId: id as string, siteId: req.siteId } },
  });
  if (!link) return error(res, "Platform is not on this site", 404);

  await prisma.platformSite.delete({
    where: { platformId_siteId: { platformId: id as string, siteId: req.siteId } },
  });

  await logAudit(req.userId!, "UNASSIGN", "platform", id as string, { name: platform.name }, req.siteId);

  return success(res, { message: "Platform removed from this site" });
}

export async function listSharedPlatforms(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where = req.siteId
    ? { sites: { none: { siteId: req.siteId } } }
    : {};

  const [platforms, total] = await Promise.all([
    prisma.platform.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip,
      take: limit,
      include: {
        _count: { select: { contents: true } },
        contentTypes: { include: { contentType: { select: { id: true, slug: true, name: true } } } },
        sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
      },
    }),
    prisma.platform.count({ where }),
  ]);

  const mapped = platforms.map((p) => ({
    ...p,
    count: p._count.contents,
    contentTypes: p.contentTypes.map((ct) => ct.contentType),
    siteNames: p.sites.map((s) => s.site.name),
    _count: undefined,
    sites: undefined,
  }));

  return paginated(res, mapped, total, page, limit);
}
