import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // Super Admin always passes
    if (req.userRole === Role.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }

    next();
  };
}
