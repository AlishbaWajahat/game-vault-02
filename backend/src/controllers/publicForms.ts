import { Request, Response } from "express";
import { prisma } from "../config/database";
import { hashIp } from "../utils/crypto";
import { success } from "../utils/response";
import sanitizeHtml from "sanitize-html";

export async function submitContentRequest(req: Request, res: Response) {
  const { title, platform } = req.body;
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  const request = await prisma.contentRequest.create({
    data: {
      title: sanitizeHtml(title, { allowedTags: [] }),
      platform: sanitizeHtml(platform, { allowedTags: [] }),
      ipHash: hashIp(ip),
      siteId: req.siteId || undefined,
    },
  });

  return success(res, { id: request.id, message: "Request submitted successfully" }, 201);
}

export async function submitContact(req: Request, res: Response) {
  const { name, email, subject, message } = req.body;

  const contact = await prisma.contactMessage.create({
    data: {
      name: sanitizeHtml(name, { allowedTags: [] }),
      email: sanitizeHtml(email, { allowedTags: [] }),
      subject: sanitizeHtml(subject, { allowedTags: [] }),
      message: sanitizeHtml(message, { allowedTags: [] }),
      siteId: req.siteId || undefined,
    },
  });

  return success(res, { id: contact.id, message: "Message sent successfully" }, 201);
}
