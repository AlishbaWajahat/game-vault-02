import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success } from "../utils/response";
import { Role, Prisma } from "@prisma/client";

export async function getDashboard(req: Request, res: Response) {
  const role = req.userRole;
  const siteId = req.siteId;

  // Site-scoped where clauses
  const contentSiteWhere = siteId ? { sites: { some: { siteId } } } : {};
  const platformSiteWhere = siteId ? { sites: { some: { siteId } } } : {};
  const categorySiteWhere = siteId ? { sites: { some: { siteId } } } : {};
  const directSiteWhere = siteId ? { siteId } : {};
  const downloadSiteWhere: Prisma.DownloadLogWhereInput = siteId ? { siteId } : {};

  // Base stats everyone sees
  const [totalContent, totalPlatforms, totalCategories] = await Promise.all([
    prisma.content.count({ where: contentSiteWhere }),
    prisma.platform.count({ where: platformSiteWhere }),
    prisma.category.count({ where: categorySiteWhere }),
  ]);

  const stats: Record<string, unknown> = { totalContent, totalPlatforms, totalCategories };

  if (role === Role.SUPER_ADMIN || role === Role.GAME_MANAGER) {
    const [totalDownloads, pendingRequests, recentDownloads] = await Promise.all([
      prisma.downloadLog.count({ where: downloadSiteWhere }),
      prisma.contentRequest.count({ where: { status: "PENDING", ...directSiteWhere } }),
      prisma.downloadLog.count({
        where: {
          ...downloadSiteWhere,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);
    stats.totalDownloads = totalDownloads;
    stats.pendingRequests = pendingRequests;
    stats.recentDownloads = recentDownloads;
  }

  if (role === Role.SUPER_ADMIN || role === Role.CONTENT_MANAGER) {
    const [totalArticles, unreadMessages] = await Promise.all([
      prisma.article.count({ where: directSiteWhere }),
      prisma.contactMessage.count({ where: { status: "UNREAD", ...directSiteWhere } }),
    ]);
    stats.totalArticles = totalArticles;
    stats.unreadMessages = unreadMessages;
  }

  if (role === Role.SUPER_ADMIN) {
    const [totalUsers, totalContentTypes, totalSites] = await Promise.all([
      prisma.user.count(),
      prisma.contentType.count(),
      prisma.site.count(),
    ]);
    stats.totalUsers = totalUsers;
    stats.totalContentTypes = totalContentTypes;
    stats.totalSites = totalSites;
  }

  // Top content by downloads (scoped to site)
  const topContent = await prisma.content.findMany({
    where: contentSiteWhere,
    orderBy: { downloads: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      slug: true,
      downloads: true,
      isPublished: true,
      contentType: { select: { id: true, slug: true, name: true } },
    },
  });
  stats.topContent = topContent;

  // Recent downloads chart data (last 7 days)
  if (role === Role.SUPER_ADMIN || role === Role.GAME_MANAGER) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const downloads = await prisma.downloadLog.findMany({
      where: {
        ...downloadSiteWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dailyCounts[date.toISOString().split("T")[0]] = 0;
    }
    for (const d of downloads) {
      const key = d.createdAt.toISOString().split("T")[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    }
    stats.downloadChart = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

    // Content distribution by type (scoped to site)
    if (siteId) {
      const contentTypes = await prisma.contentType.findMany({
        select: {
          name: true,
          contents: {
            where: { sites: { some: { siteId } } },
            select: { id: true },
          },
        },
      });
      stats.contentByType = contentTypes.map((ct) => ({ name: ct.name, count: ct.contents.length }));
    } else {
      const contentByType = await prisma.contentType.findMany({
        select: { name: true, _count: { select: { contents: true } } },
      });
      stats.contentByType = contentByType.map((ct) => ({ name: ct.name, count: ct._count.contents }));
    }
  }

  return success(res, stats);
}
