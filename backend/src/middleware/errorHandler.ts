import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Error]", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, error: "CORS not allowed" });
  }

  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
