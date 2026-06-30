import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success } from "../utils/response";

export async function getPublicSettings(req: Request, res: Response) {
  const siteId = req.siteId || null;

  const settings = await prisma.siteSetting.findMany({
    where: {
      siteId,
      group: { in: ["homepage", "about", "general"] },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return success(res, map);
}
