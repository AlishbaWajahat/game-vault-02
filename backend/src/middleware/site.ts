import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { env } from "../config/env";

let cachedSiteId: string | null = null;

export async function siteMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!cachedSiteId) {
    const site = await prisma.site.findUnique({ where: { siteId: env.SITE_ID } });
    if (site) {
      cachedSiteId = site.id;
    }
  }

  req.siteId = cachedSiteId || undefined;
  next();
}
