import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success, error } from "../utils/response";
import { Prisma } from "@prisma/client";

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

export async function getPlatform(req: Request, res: Response) {
  const slug = req.params.slug as string;

  const platform: any = await prisma.platform.findUnique({
    where: { slug },
    include: {
      contentTypes: { include: { contentType: { select: { id: true, slug: true, name: true } } } },
      sites: true,
    },
  });

  if (!platform) {
    return error(res, "Platform not found", 404);
  }

  // Check platform is linked to current site
  if (req.siteId) {
    const onSite = platform.sites.some((s: any) => s.siteId === req.siteId);
    if (!onSite) {
      return error(res, "Platform not found", 404);
    }
  }

  const contentWhere: Prisma.ContentWhereInput = {
    isPublished: true,
    platforms: { some: { platformId: platform.id } },
  };

  // Site scoping
  if (req.siteId) {
    contentWhere.sites = { some: { siteId: req.siteId } };
  }

  const contents = await prisma.content.findMany({
    where: contentWhere,
    orderBy: { popularity: "desc" },
    include: {
      contentType: { select: { id: true, slug: true, name: true } },
      platforms: { include: { platform: true } },
    },
  });

  const mappedContents = contents.map((c) => ({
    ...c,
    platform: c.platforms.map((p) => p.platform.name),
    platforms: undefined,
  }));

  return success(res, {
    ...platform,
    contentTypes: platform.contentTypes.map((ct: any) => ct.contentType),
    contents: mappedContents,
    sites: undefined,
  });
}
