import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { generateSlug } from "../utils/slug";
import { logAudit } from "../middleware/audit";
import { success, paginated, error } from "../utils/response";
import { validateDynamicFields } from "../utils/fieldValidation";
import sanitizeHtml from "sanitize-html";
import { Prisma } from "@prisma/client";
import { revalidatePaths } from "../lib/revalidate";

function formatFileSize(bytes: bigint): string {
  if (bytes === 0n) return "";
  const num = Number(bytes);
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

const contentInclude = {
  contentType: { select: { id: true, slug: true, name: true } },
  platforms: { include: { platform: true } },
  sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
  files: { where: { uploadStatus: "COMPLETE" as const }, select: { fileSize: true } },
} as const;

const contentDetailInclude = {
  contentType: { select: { id: true, slug: true, name: true } },
  platforms: { include: { platform: true } },
  sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
  files: true,
} as const;

export async function listContent(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
  const search = req.query.search as string | undefined;
  const contentTypeId = req.query.contentTypeId as string | undefined;
  const typeSlug = req.query.typeSlug as string | undefined;

  // Scope to current site — admin only sees content linked to their site
  const where: Prisma.ContentWhereInput = {
    ...(req.siteId ? { sites: { some: { siteId: req.siteId } } } : {}),
  };

  if (contentTypeId) {
    where.contentTypeId = contentTypeId;
  } else if (typeSlug) {
    where.contentType = { slug: typeSlug };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: contentInclude,
    }),
    prisma.content.count({ where }),
  ]);

  const mapped = contents.map((c: any) => {
    const totalBytes = c.files.reduce((sum: bigint, f: any) => sum + f.fileSize, 0n);
    return {
      ...c,
      platform: c.platforms.map((p: any) => p.platform.name),
      platformIds: c.platforms.map((p: any) => p.platformId),
      siteNames: c.sites.map((s: any) => s.site.name),
      siteIds: c.sites.map((s: any) => s.siteId),
      siteCount: c.sites.length,
      platforms: undefined,
      sites: undefined,
      fileCount: c.files.length,
      totalFileSize: formatFileSize(totalBytes),
      files: undefined,
    };
  });

  return paginated(res, mapped, total, page, limit);
}

export async function getContent(req: Request, res: Response) {
  const { id } = req.params;

  const content: any = await prisma.content.findUnique({
    where: { id: id as string },
    include: contentDetailInclude,
  });

  if (!content) return error(res, "Content not found", 404);

  const totalBytes = content.files.reduce((sum: bigint, f: any) => sum + f.fileSize, 0n);
  return success(res, {
    ...content,
    platformIds: content.platforms.map((p: any) => p.platformId),
    platform: content.platforms.map((p: any) => p.platform.name),
    siteIds: content.sites.map((s: any) => s.siteId),
    siteNames: content.sites.map((s: any) => s.site.name),
    platforms: undefined,
    sites: undefined,
    totalFileSize: formatFileSize(totalBytes),
    files: content.files.map((f: any) => ({ ...f, fileSize: f.fileSize.toString() })),
  });
}

export async function createContent(req: Request, res: Response) {
  const { platformIds, description, fields, ...data } = req.body;
  const slug = data.slug || generateSlug(data.title);

  const existing = await prisma.content.findUnique({
    where: { slug },
    include: {
      contentType: { select: { id: true, slug: true, name: true } },
      platforms: { include: { platform: true } },
      sites: { include: { site: { select: { id: true, siteId: true, name: true } } } },
    },
  });

  if (existing) {
    // Check if it's already on the current site
    const onCurrentSite = existing.sites.some((s: any) => s.siteId === req.siteId);
    if (onCurrentSite) {
      return error(res, "Content with this slug already exists on this site");
    }

    // Content exists in shared DB but NOT on current site — offer to link
    return res.status(409).json({
      success: false,
      error: "Content with this slug exists in the shared database",
      code: "DUPLICATE_IN_SHARED_DB",
      existingContent: {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        coverImage: existing.coverImage,
        contentType: existing.contentType,
        platform: existing.platforms.map((p: any) => p.platform.name),
        sites: existing.sites.map((s: any) => s.site.name),
      },
    });
  }

  // Validate contentTypeId exists
  const contentType = await prisma.contentType.findUnique({
    where: { id: data.contentTypeId },
    include: { fields: true },
  });
  if (!contentType) return error(res, "Content type not found");

  // Validate dynamic fields against type definitions
  if (fields && Object.keys(fields).length > 0) {
    const validation = validateDynamicFields(fields, contentType.fields);
    if (!validation.valid) {
      return error(res, `Field validation failed: ${validation.errors.join(", ")}`);
    }
  }

  const content = await prisma.content.create({
    data: {
      contentTypeId: data.contentTypeId,
      slug,
      title: data.title,
      coverImage: data.coverImage || "",
      description: description ? sanitizeHtml(description) : undefined,
      fields: (fields || {}) as Prisma.InputJsonValue,
      downloads: data.downloads || 0,
      popularity: data.popularity || 0,
      isPublished: data.isPublished ?? true,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      platforms: platformIds?.length
        ? { create: platformIds.map((pid: string) => ({ platformId: pid })) }
        : undefined,
      // Auto-assign to current site
      sites: req.siteId
        ? { create: { siteId: req.siteId } }
        : undefined,
    },
    include: {
      contentType: { select: { id: true, slug: true, name: true } },
      platforms: { include: { platform: true } },
    },
  });

  await logAudit(req.userId!, "CREATE", "content", content.id, {
    title: content.title,
    type: content.contentType.name,
  }, req.siteId);

  const typeSlug = content.contentType.slug;
  revalidatePaths([`/${typeSlug}/${slug}`, `/${typeSlug}`, `/`], ["content", `content-${slug}`, `content-type-${typeSlug}`, "content-types"]);

  return success(res, {
    ...content,
    platform: content.platforms.map((p) => p.platform.name),
    platforms: undefined,
  }, 201);
}

export async function updateContent(req: Request, res: Response) {
  const { id } = req.params;
  const { platformIds, description, fields, ...data } = req.body;

  const existing = await prisma.content.findUnique({
    where: { id: id as string },
    include: { contentType: { include: { fields: true } } },
  });
  if (!existing) return error(res, "Content not found", 404);

  // Validate dynamic fields if provided
  if (fields && Object.keys(fields).length > 0) {
    const mergedFields = { ...(existing.fields as Record<string, unknown>), ...fields };
    const validation = validateDynamicFields(mergedFields, existing.contentType.fields);
    if (!validation.valid) {
      return error(res, `Field validation failed: ${validation.errors.join(", ")}`);
    }
  }

  // Update platforms if provided
  if (platformIds) {
    await prisma.contentPlatform.deleteMany({ where: { contentId: id as string } });
    if (platformIds.length > 0) {
      await prisma.contentPlatform.createMany({
        data: platformIds.map((pid: string) => ({ contentId: id as string, platformId: pid })),
      });
    }
  }

  const updateData: Prisma.ContentUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.downloads !== undefined) updateData.downloads = data.downloads;
  if (data.popularity !== undefined) updateData.popularity = data.popularity;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
  if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
  if (description !== undefined) {
    updateData.description = description ? sanitizeHtml(description) : existing.description;
  }
  if (fields) {
    updateData.fields = { ...(existing.fields as Record<string, unknown>), ...fields } as Prisma.InputJsonValue;
  }

  const content = await prisma.content.update({
    where: { id: id as string },
    data: updateData,
    include: {
      contentType: { select: { id: true, slug: true, name: true } },
      platforms: { include: { platform: true } },
    },
  });

  await logAudit(req.userId!, "UPDATE", "content", content.id, { title: content.title }, req.siteId);

  const typeSlug = content.contentType.slug;
  revalidatePaths([`/${typeSlug}/${content.slug}`, `/${typeSlug}`, `/`], ["content", `content-${content.slug}`, `content-type-${typeSlug}`, "content-types"]);

  return success(res, {
    ...content,
    platform: content.platforms.map((p) => p.platform.name),
    platforms: undefined,
  });
}

export async function deleteContent(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.content.findUnique({
    where: { id: id as string },
    include: {
      contentType: { select: { slug: true } },
      _count: { select: { sites: true } },
    },
  });
  if (!existing) return error(res, "Content not found", 404);

  // Safety: if content is linked to multiple sites, don't allow delete
  if (existing._count.sites > 1) {
    return error(
      res,
      `Cannot delete: content is shared across ${existing._count.sites} sites. Remove from other sites first, or use "Remove from My Site" to unlink.`,
    );
  }

  await prisma.content.delete({ where: { id: id as string } });
  await logAudit(req.userId!, "DELETE", "content", id as string, { title: existing.title }, req.siteId);

  const typeSlug = existing.contentType.slug;
  revalidatePaths([`/${typeSlug}/${existing.slug}`, `/${typeSlug}`, `/`], ["content", `content-${existing.slug}`, `content-type-${typeSlug}`, "content-types"]);

  return success(res, { message: "Content deleted" });
}

// ── Multi-Site Deduplication ──

export async function listSharedContent(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
  const search = req.query.search as string | undefined;
  const contentTypeId = req.query.contentTypeId as string | undefined;
  const typeSlug = req.query.typeSlug as string | undefined;

  // Content that exists in the shared DB but is NOT linked to the current site
  const where: Prisma.ContentWhereInput = {
    sites: { none: { siteId: req.siteId } },
  };

  if (contentTypeId) {
    where.contentTypeId = contentTypeId;
  } else if (typeSlug) {
    where.contentType = { slug: typeSlug };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: contentInclude,
    }),
    prisma.content.count({ where }),
  ]);

  const mapped = contents.map((c: any) => {
    const totalBytes = c.files.reduce((sum: bigint, f: any) => sum + f.fileSize, 0n);
    return {
      ...c,
      platform: c.platforms.map((p: any) => p.platform.name),
      platformIds: c.platforms.map((p: any) => p.platformId),
      siteNames: c.sites.map((s: any) => s.site.name),
      siteIds: c.sites.map((s: any) => s.siteId),
      platforms: undefined,
      sites: undefined,
      fileCount: c.files.length,
      totalFileSize: formatFileSize(totalBytes),
      files: undefined,
    };
  });

  return paginated(res, mapped, total, page, limit);
}

export async function assignContentToSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const content = await prisma.content.findUnique({ where: { id: id as string } });
  if (!content) return error(res, "Content not found", 404);

  // Check if already assigned
  const existing = await prisma.contentSite.findUnique({
    where: { contentId_siteId: { contentId: id as string, siteId: req.siteId } },
  });
  if (existing) return error(res, "Content is already on this site");

  await prisma.contentSite.create({
    data: { contentId: id as string, siteId: req.siteId },
  });

  await logAudit(req.userId!, "ASSIGN", "content", id as string, { title: content.title }, req.siteId);

  return success(res, { message: "Content added to this site" }, 201);
}

export async function unassignContentFromSite(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.siteId) return error(res, "Site context not available");

  const content = await prisma.content.findUnique({
    where: { id: id as string },
    include: { _count: { select: { sites: true } } },
  });
  if (!content) return error(res, "Content not found", 404);

  // Check if it's actually on this site
  const link = await prisma.contentSite.findUnique({
    where: { contentId_siteId: { contentId: id as string, siteId: req.siteId } },
  });
  if (!link) return error(res, "Content is not on this site", 404);

  // Don't allow removing from the only site — use delete instead
  if (content._count.sites <= 1) {
    return error(res, "Content is only on this site. Use delete to remove it entirely.");
  }

  await prisma.contentSite.delete({
    where: { contentId_siteId: { contentId: id as string, siteId: req.siteId } },
  });

  await logAudit(req.userId!, "UNASSIGN", "content", id as string, { title: content.title }, req.siteId);

  return success(res, { message: "Content removed from this site" });
}
