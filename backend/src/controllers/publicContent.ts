import { Request, Response } from "express";
import { prisma } from "../config/database";
import { parsePagination } from "../utils/pagination";
import { success, paginated, error } from "../utils/response";
import { hashIp } from "../utils/crypto";
import { Prisma } from "@prisma/client";

function formatFileSize(bytes: bigint): string {
  if (bytes === 0n) return "";
  const num = Number(bytes);
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export async function listContentTypes(req: Request, res: Response) {
  const where: Prisma.ContentTypeWhereInput = { isActive: true };

  // If site-scoped, only show types that have content on this site
  if (req.siteId) {
    where.contents = { some: { sites: { some: { siteId: req.siteId } } } };
  }

  const types = await prisma.contentType.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, icon: true, description: true },
  });

  return success(res, types);
}

export async function listContentByType(req: Request, res: Response) {
  const { typeSlug } = req.params;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
  const { platform, sort, search } = req.query;

  const contentType = await prisma.contentType.findUnique({ where: { slug: typeSlug as string } });
  if (!contentType) return error(res, "Content type not found", 404);

  const where: Prisma.ContentWhereInput = {
    isPublished: true,
    contentTypeId: contentType.id,
  };

  // Site scoping
  if (req.siteId) {
    where.sites = { some: { siteId: req.siteId } };
  }

  if (platform) {
    where.platforms = { some: { platform: { slug: platform as string } } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: "insensitive" } },
      { description: { contains: search as string, mode: "insensitive" } },
    ];
  }

  // Parse dynamic field filters: filter[genre]=RPG, filter[isRom]=true, etc.
  // Express/qs parses filter[x]=y into { filter: { x: "y" } }
  const fieldFilters: Prisma.ContentWhereInput[] = [];
  const filterObj = req.query.filter;
  if (filterObj && typeof filterObj === "object") {
    for (const [fieldSlug, value] of Object.entries(filterObj as Record<string, string>)) {
      const strValue = String(value);
      if (strValue === "true" || strValue === "false") {
        fieldFilters.push({
          fields: { path: [fieldSlug], equals: strValue === "true" },
        });
      } else {
        fieldFilters.push({
          fields: { path: [fieldSlug], equals: strValue },
        });
      }
    }
  }
  if (fieldFilters.length > 0) {
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), ...fieldFilters];
  }

  let orderBy: Prisma.ContentOrderByWithRelationInput = { popularity: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };
  if (sort === "title") orderBy = { title: "asc" };
  if (sort === "downloads") orderBy = { downloads: "desc" };
  if (sort === "popularity") orderBy = { popularity: "desc" };

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        platforms: { include: { platform: true } },
        files: { where: { uploadStatus: "COMPLETE" }, select: { fileSize: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  const mapped = contents.map((c: any) => {
    const totalBytes = c.files.reduce((sum: bigint, f: any) => sum + f.fileSize, 0n);
    return {
      ...c,
      platform: c.platforms.map((p: any) => p.platform.name),
      platforms: undefined,
      totalFileSize: formatFileSize(totalBytes),
      files: undefined,
    };
  });

  return paginated(res, mapped, total, page, limit);
}

export async function getContentBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const content: any = await prisma.content.findUnique({
    where: { slug: slug as string },
    include: {
      contentType: {
        include: { fields: { where: { showInDetail: true }, orderBy: { sortOrder: "asc" } } },
      },
      platforms: { include: { platform: true } },
      files: { where: { uploadStatus: "COMPLETE" }, select: { id: true, fileName: true, fileSize: true } },
    },
  });

  if (!content || !content.isPublished) {
    return error(res, "Content not found", 404);
  }

  // Site scope check
  if (req.siteId) {
    const onSite = await prisma.contentSite.findUnique({
      where: { contentId_siteId: { contentId: content.id, siteId: req.siteId } },
    });
    if (!onSite) return error(res, "Content not found", 404);
  }

  const totalBytes = content.files.reduce((sum: bigint, f: any) => sum + f.fileSize, 0n);
  return success(res, {
    ...content,
    platform: content.platforms.map((p: any) => p.platform.name),
    platforms: undefined,
    totalFileSize: formatFileSize(totalBytes),
    files: content.files.map((f: any) => ({ ...f, fileSize: f.fileSize.toString() })),
    fieldDefinitions: content.contentType.fields,
    contentType: { id: content.contentType.id, slug: content.contentType.slug, name: content.contentType.name },
  });
}

export async function downloadContent(req: Request, res: Response) {
  const { slug } = req.params;

  const content = await prisma.content.findUnique({
    where: { slug: slug as string },
    include: { files: { where: { uploadStatus: "COMPLETE" }, take: 1 } },
  });

  if (!content || !content.isPublished) {
    return error(res, "Content not found", 404);
  }

  if (content.files.length === 0) {
    return error(res, "No download files available", 404);
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  await Promise.all([
    prisma.downloadLog.create({
      data: {
        contentId: content.id,
        siteId: req.siteId || null,
        ipHash: hashIp(ip),
        country: (req.headers["cf-ipcountry"] as string) || null,
        userAgent: req.headers["user-agent"] || null,
      },
    }),
    prisma.content.update({
      where: { id: content.id },
      data: { downloads: { increment: 1 } },
    }),
  ]);

  try {
    const { generateDownloadUrl } = await import("../services/storage");
    const downloadUrl = await generateDownloadUrl(content.files[0].storageKey);
    return success(res, { downloadUrl, fileName: content.files[0].fileName });
  } catch {
    return error(res, "Download temporarily unavailable", 503);
  }
}
