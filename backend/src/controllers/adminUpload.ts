import { Request, Response } from "express";
import { logAudit } from "../middleware/audit";
import { success, error } from "../utils/response";
import { uploadSingleFile, generateImageUrl } from "../services/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(req: Request, res: Response) {
  const { fileName, contentType, data } = req.body;

  if (!fileName || !contentType || !data) {
    return error(res, "fileName, contentType, and data are required", 400);
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return error(
      res,
      `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
      400,
    );
  }

  const buffer = Buffer.from(data, "base64");

  if (buffer.length > MAX_SIZE) {
    return error(res, "File too large. Maximum size is 5MB", 400);
  }

  const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
  const storageKey = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    await uploadSingleFile(storageKey, buffer, contentType);

    const url = await generateImageUrl(storageKey);

    await logAudit(req.userId!, "UPLOAD_IMAGE", "image", storageKey, undefined, req.siteId);

    return success(res, { url, storageKey });
  } catch (err) {
    console.error("Image upload failed:", err);
    return error(res, "Failed to upload image", 500);
  }
}
