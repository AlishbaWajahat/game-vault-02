import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";

export async function listSites(_req: Request, res: Response) {
  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { contentSites: true } } },
  });

  const mapped = sites.map((s) => ({
    ...s,
    contentCount: s._count.contentSites,
    _count: undefined,
  }));

  return success(res, mapped);
}

export async function getSite(req: Request, res: Response) {
  const { id } = req.params;

  const site = await prisma.site.findUnique({
    where: { id: id as string },
    include: { _count: { select: { contentSites: true } } },
  });

  if (!site) return error(res, "Site not found", 404);
  return success(res, { ...site, contentCount: site._count.contentSites, _count: undefined });
}

export async function createSite(req: Request, res: Response) {
  const data = req.body;

  const existing = await prisma.site.findUnique({ where: { siteId: data.siteId } });
  if (existing) return error(res, "Site with this ID already exists");

  const site = await prisma.site.create({
    data: { siteId: data.siteId, name: data.name, domain: data.domain, description: data.description, isActive: data.isActive },
  });
  await logAudit(req.userId!, "CREATE", "site", site.id, { name: site.name, siteId: site.siteId }, req.siteId);

  return success(res, site, 201);
}

export async function updateSite(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.site.findUnique({ where: { id: id as string } });
  if (!existing) return error(res, "Site not found", 404);

  const site = await prisma.site.update({ where: { id: id as string }, data: req.body });
  await logAudit(req.userId!, "UPDATE", "site", site.id, { name: site.name }, req.siteId);

  return success(res, site);
}

export async function deleteSite(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.site.findUnique({
    where: { id: id as string },
    include: { _count: { select: { contentSites: true } } },
  });
  if (!existing) return error(res, "Site not found", 404);

  if (existing._count.contentSites > 0) {
    return error(res, `Cannot delete: ${existing._count.contentSites} content items are linked to this site`);
  }

  await prisma.site.delete({ where: { id: id as string } });
  await logAudit(req.userId!, "DELETE", "site", id as string, { name: existing.name }, req.siteId);

  return success(res, { message: "Site deleted" });
}
