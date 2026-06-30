import { Request, Response } from "express";
import { prisma } from "../config/database";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";
import * as storage from "../services/storage";

export async function initiateUpload(req: Request, res: Response) {
  const contentId = req.params.id as string;
  const { fileName, fileSize } = req.body;

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return error(res, "Content not found", 404);

  // Only 1 file per content item
  const existingFile = await prisma.contentFile.findFirst({
    where: { contentId, uploadStatus: "COMPLETE" },
  });
  if (existingFile) {
    return error(res, "This content already has a file. Delete it first to upload a new one.", 400);
  }

  // Check for duplicate: same fileName + fileSize already uploaded (COMPLETE status)
  const duplicate = await prisma.contentFile.findFirst({
    where: {
      fileName,
      fileSize: BigInt(fileSize),
      uploadStatus: "COMPLETE",
    },
    include: {
      content: { select: { title: true, slug: true } },
    },
  });

  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: "DUPLICATE_FILE",
      message: `This file already exists in "${duplicate.content.title}"`,
      duplicate: {
        fileId: duplicate.id,
        fileName: duplicate.fileName,
        fileSize: duplicate.fileSize.toString(),
        storageKey: duplicate.storageKey,
        contentTitle: duplicate.content.title,
        contentSlug: duplicate.content.slug,
      },
    });
  }

  const storageKey = `content/${content.slug}/${Date.now()}-${fileName}`;

  const contentFile = await prisma.contentFile.create({
    data: {
      contentId,
      fileName,
      storageKey,
      fileSize: BigInt(fileSize),
      uploadStatus: "UPLOADING",
    },
  });

  try {
    const upload = await storage.initiateMultipartUpload(storageKey, fileSize);

    await prisma.contentFile.update({
      where: { id: contentFile.id },
      data: { uploadId: upload.uploadId },
    });

    await logAudit(req.userId!, "UPLOAD_INIT", "content_file", contentFile.id, { fileName, fileSize }, req.siteId);

    return success(res, {
      fileId: contentFile.id,
      uploadId: upload.uploadId,
      presignedUrls: upload.presignedUrls,
      chunkSize: upload.chunkSize,
    }, 201);
  } catch {
    await prisma.contentFile.update({ where: { id: contentFile.id }, data: { uploadStatus: "FAILED" } });
    return error(res, "Failed to initiate upload", 500);
  }
}

// Reuse an existing file for a different content item (no re-upload)
export async function reuseFile(req: Request, res: Response) {
  const contentId = req.params.id as string;
  const { sourceFileId } = req.body;

  if (!sourceFileId) return error(res, "sourceFileId is required", 400);

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return error(res, "Content not found", 404);

  // Only 1 file per content item
  const existingFile = await prisma.contentFile.findFirst({
    where: { contentId, uploadStatus: "COMPLETE" },
  });
  if (existingFile) {
    return error(res, "This content already has a file. Delete it first to upload a new one.", 400);
  }

  const sourceFile = await prisma.contentFile.findFirst({
    where: { id: sourceFileId, uploadStatus: "COMPLETE" },
  });

  if (!sourceFile) return error(res, "Source file not found or incomplete", 404);

  // Create a new ContentFile record referencing the same storageKey
  const newFile = await prisma.contentFile.create({
    data: {
      contentId,
      fileName: sourceFile.fileName,
      storageKey: sourceFile.storageKey,
      fileSize: sourceFile.fileSize,
      checksum: sourceFile.checksum,
      uploadStatus: "COMPLETE",
    },
  });

  await logAudit(req.userId!, "FILE_REUSE", "content_file", newFile.id, {
    fileName: sourceFile.fileName,
    sourceFileId: sourceFile.id,
  }, req.siteId);

  return success(res, {
    ...newFile,
    fileSize: newFile.fileSize.toString(),
  }, 201);
}

export async function completeUpload(req: Request, res: Response) {
  const contentId = req.params.id as string;
  const { fileId, uploadId, parts } = req.body;

  const contentFile = await prisma.contentFile.findFirst({
    where: { id: fileId, contentId },
  });

  if (!contentFile) return error(res, "File not found", 404);

  try {
    await storage.completeMultipartUpload(contentFile.storageKey, uploadId, parts);

    await prisma.contentFile.update({
      where: { id: contentFile.id },
      data: { uploadStatus: "COMPLETE" },
    });

    await logAudit(req.userId!, "UPLOAD_COMPLETE", "content_file", contentFile.id, { fileName: contentFile.fileName }, req.siteId);

    return success(res, { message: "Upload completed" });
  } catch {
    await prisma.contentFile.update({ where: { id: contentFile.id }, data: { uploadStatus: "FAILED" } });
    return error(res, "Failed to complete upload", 500);
  }
}

export async function deleteFile(req: Request, res: Response) {
  const contentId = req.params.id as string;
  const fileId = req.params.fileId as string;

  const contentFile = await prisma.contentFile.findFirst({
    where: { id: fileId, contentId },
  });

  if (!contentFile) return error(res, "File not found", 404);

  // Only delete from storage if no other ContentFile references the same storageKey
  const otherRefs = await prisma.contentFile.count({
    where: {
      storageKey: contentFile.storageKey,
      id: { not: contentFile.id },
    },
  });

  if (otherRefs === 0) {
    try {
      await storage.deleteFile(contentFile.storageKey);
    } catch {
      // File may not exist on storage
    }
  }

  await prisma.contentFile.delete({ where: { id: contentFile.id } });
  await logAudit(req.userId!, "DELETE", "content_file", contentFile.id, { fileName: contentFile.fileName }, req.siteId);

  return success(res, { message: "File deleted" });
}

export async function listFiles(req: Request, res: Response) {
  const contentId = req.params.id as string;

  const files = await prisma.contentFile.findMany({
    where: { contentId },
    orderBy: { createdAt: "desc" },
  });

  return success(res, files.map((f) => ({ ...f, fileSize: f.fileSize.toString() })));
}
