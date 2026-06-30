import rateLimit from "express-rate-limit";

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: "Too many requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many submissions, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many download requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
