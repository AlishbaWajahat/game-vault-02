import express from "express";
import helmet from "helmet";
import { corsConfig } from "./config/cors";
import { publicLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";

const app = express();

// Security
app.use(helmet());
app.use(corsConfig);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (Railway proxy + Cloudflare proxy)
app.set("trust proxy", 2);

// Prefer CF-Connecting-IP for accurate client IP behind Cloudflare
app.use((req, _res, next) => {
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string") {
    Object.defineProperty(req, "ip", { value: cfIp, writable: true });
  }
  next();
});

// Rate limiting on public routes
app.use("/public", publicLimiter);

// Routes
app.use("/auth", authRoutes);
app.use("/public", publicRoutes);
app.use("/admin", adminRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
