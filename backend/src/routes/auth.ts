import { Router } from "express";
import { login, refresh, logout } from "../controllers/auth";
import { validate } from "../middleware/validate";
import { loginSchema, refreshSchema } from "../schemas/auth";
import { loginLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", logout);

export default router;
