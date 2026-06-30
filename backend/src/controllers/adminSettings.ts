import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";
import { Role } from "@prisma/client";
import { revalidatePaths } from "../lib/revalidate";

export async function listSettings(req: Request, res: Response) {
  const group = req.query.group as string | undefined;
  const siteId = req.siteId || null;

  // Content managers can only see content-related groups
  if (req.userRole === Role.CONTENT_MANAGER) {
    const allowed = ["seo", "homepage", "about"];
    if (group && !allowed.includes(group)) {
      return error(res, "Insufficient permissions", 403);
    }
    const settings = await prisma.siteSetting.findMany({
      where: {
        siteId,
        ...(group ? { group } : { group: { in: allowed } }),
      },
      orderBy: { key: "asc" },
    });
    return success(res, settings);
  }

  const settings = await prisma.siteSetting.findMany({
    where: { siteId, ...(group ? { group } : {}) },
    orderBy: { key: "asc" },
  });
  return success(res, settings);
}

export async function updateSetting(req: Request, res: Response) {
  const key = req.params.key as string;
  const { value } = req.body;
  const siteId = req.siteId || null;

  const existing = await prisma.siteSetting.findFirst({ where: { key, siteId } });
  if (!existing) return error(res, "Setting not found", 404);

  // Content managers can only update content groups
  if (req.userRole === Role.CONTENT_MANAGER) {
    const allowed = ["seo", "homepage", "about"];
    if (!allowed.includes(existing.group)) {
      return error(res, "Insufficient permissions", 403);
    }
  }

  const setting = await prisma.siteSetting.update({
    where: { id: existing.id },
    data: { value },
  });

  await logAudit(req.userId!, "UPDATE", "setting", key, undefined, req.siteId);
  revalidatePaths([`/`, `/about`], ["settings"]);
  return success(res, setting);
}

export async function bulkUpdateSettings(req: Request, res: Response) {
  const { settings } = req.body;
  const siteId = req.siteId || null;

  for (const s of settings) {
    const existing = await prisma.siteSetting.findFirst({ where: { key: s.key, siteId } });
    if (existing) {
      await prisma.siteSetting.update({
        where: { id: existing.id },
        data: { value: s.value },
      });
    } else {
      await prisma.siteSetting.create({
        data: { key: s.key, value: s.value, group: s.group || "general", siteId },
      });
    }
  }

  await logAudit(req.userId!, "BULK_UPDATE", "settings", undefined, { count: settings.length }, req.siteId);
  revalidatePaths([`/`, `/about`], ["settings"]);
  return success(res, { message: "Settings updated" });
}
