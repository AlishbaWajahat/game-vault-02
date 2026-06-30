import { Request, Response } from "express";
import { prisma } from "../config/database";
import { generateSlug } from "../utils/slug";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";
import { getFieldTemplate } from "../config/fieldTemplates";
import { revalidatePaths } from "../lib/revalidate";

// ── Content Types ──

export async function listContentTypes(_req: Request, res: Response) {
  const types = await prisma.contentType.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { fields: true, contents: true } } },
  });

  const mapped = types.map((t) => ({
    ...t,
    fieldsCount: t._count.fields,
    contentsCount: t._count.contents,
    _count: undefined,
  }));

  return success(res, mapped);
}

export async function getContentType(req: Request, res: Response) {
  const { id } = req.params;

  const type = await prisma.contentType.findUnique({
    where: { id: id as string },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { contents: true } },
    },
  });

  if (!type) return error(res, "Content type not found", 404);
  return success(res, { ...type, contentsCount: type._count.contents, _count: undefined });
}

export async function createContentType(req: Request, res: Response) {
  const data = req.body;
  const slug = data.slug || generateSlug(data.name);

  const existing = await prisma.contentType.findUnique({ where: { slug } });
  if (existing) return error(res, "Content type with this slug already exists");

  const type = await prisma.contentType.create({
    data: { name: data.name, slug, icon: data.icon, description: data.description, isActive: data.isActive, sortOrder: data.sortOrder },
  });

  // Auto-generate default fields from template
  const template = getFieldTemplate(slug);
  if (template.length > 0) {
    await prisma.contentTypeField.createMany({
      data: template.map((f) => {
        const entry: Record<string, unknown> = {
          contentTypeId: type.id,
          slug: f.slug,
          name: f.name,
          fieldType: f.fieldType,
          isRequired: f.isRequired,
          sortOrder: f.sortOrder,
          group: f.group,
          showInList: f.showInList,
          showInDetail: f.showInDetail,
          isFilterable: f.isFilterable,
          isSortable: f.isSortable,
        };
        if (f.options) entry.options = f.options;
        if (f.validation) entry.validation = f.validation;
        if (f.defaultValue !== undefined) entry.defaultValue = f.defaultValue;
        if (f.placeholder) entry.placeholder = f.placeholder;
        return entry;
      }) as never[],
    });
  }

  await logAudit(req.userId!, "CREATE", "content_type", type.id, { name: type.name, fieldsCreated: template.length }, req.siteId);

  // Return type with fields count
  const result = await prisma.contentType.findUnique({
    where: { id: type.id },
    include: { _count: { select: { fields: true, contents: true } } },
  });

  revalidatePaths([`/`, `/${slug}`], ["content-types"]);
  return success(res, result ? { ...result, fieldsCount: result._count.fields, contentsCount: result._count.contents, _count: undefined } : type, 201);
}

export async function updateContentType(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.contentType.findUnique({ where: { id: id as string } });
  if (!existing) return error(res, "Content type not found", 404);

  const type = await prisma.contentType.update({ where: { id: id as string }, data: req.body });
  await logAudit(req.userId!, "UPDATE", "content_type", type.id, { name: type.name }, req.siteId);
  revalidatePaths([`/`, `/${type.slug}`], ["content-types"]);

  return success(res, type);
}

export async function deleteContentType(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await prisma.contentType.findUnique({
    where: { id: id as string },
    include: { _count: { select: { contents: true } } },
  });
  if (!existing) return error(res, "Content type not found", 404);

  if (existing._count.contents > 0) {
    return error(res, `Cannot delete: ${existing._count.contents} content items still use this type`);
  }

  await prisma.contentType.delete({ where: { id: id as string } });
  await logAudit(req.userId!, "DELETE", "content_type", id as string, { name: existing.name }, req.siteId);
  revalidatePaths([`/`, `/${existing.slug}`], ["content-types"]);

  return success(res, { message: "Content type deleted" });
}

// ── Content Type Fields ──

export async function listFields(req: Request, res: Response) {
  const contentTypeId = req.params.id as string;

  const type = await prisma.contentType.findUnique({ where: { id: contentTypeId } });
  if (!type) return error(res, "Content type not found", 404);

  const fields = await prisma.contentTypeField.findMany({
    where: { contentTypeId },
    orderBy: { sortOrder: "asc" },
  });

  return success(res, fields);
}

export async function createField(req: Request, res: Response) {
  const contentTypeId = req.params.id as string;

  const type = await prisma.contentType.findUnique({ where: { id: contentTypeId } });
  if (!type) return error(res, "Content type not found", 404);

  const existing = await prisma.contentTypeField.findUnique({
    where: { contentTypeId_slug: { contentTypeId, slug: req.body.slug } },
  });
  if (existing) return error(res, "Field with this slug already exists for this type");

  const field = await prisma.contentTypeField.create({
    data: { ...req.body, contentTypeId },
  });

  await logAudit(req.userId!, "CREATE", "content_type_field", field.id, {
    contentType: type.name,
    field: field.name,
  }, req.siteId);

  return success(res, field, 201);
}

export async function updateField(req: Request, res: Response) {
  const contentTypeId = req.params.id as string;
  const fieldId = req.params.fieldId as string;

  const field = await prisma.contentTypeField.findFirst({
    where: { id: fieldId, contentTypeId },
  });
  if (!field) return error(res, "Field not found", 404);

  const updated = await prisma.contentTypeField.update({
    where: { id: fieldId },
    data: req.body,
  });

  await logAudit(req.userId!, "UPDATE", "content_type_field", fieldId, { field: updated.name }, req.siteId);

  return success(res, updated);
}

export async function deleteField(req: Request, res: Response) {
  const contentTypeId = req.params.id as string;
  const fieldId = req.params.fieldId as string;

  const field = await prisma.contentTypeField.findFirst({
    where: { id: fieldId, contentTypeId },
  });
  if (!field) return error(res, "Field not found", 404);

  await prisma.contentTypeField.delete({ where: { id: fieldId } });
  await logAudit(req.userId!, "DELETE", "content_type_field", fieldId, { field: field.name }, req.siteId);

  return success(res, { message: "Field deleted" });
}

export async function reorderFields(req: Request, res: Response) {
  const contentTypeId = req.params.id as string;
  const { fieldIds } = req.body;

  if (!Array.isArray(fieldIds)) return error(res, "fieldIds must be an array");

  const type = await prisma.contentType.findUnique({ where: { id: contentTypeId } });
  if (!type) return error(res, "Content type not found", 404);

  for (let i = 0; i < fieldIds.length; i++) {
    await prisma.contentTypeField.updateMany({
      where: { id: fieldIds[i], contentTypeId },
      data: { sortOrder: i },
    });
  }

  await logAudit(req.userId!, "REORDER", "content_type_field", contentTypeId, { count: fieldIds.length }, req.siteId);

  return success(res, { message: "Fields reordered" });
}
