import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001").split(","),
  B2_KEY_ID: process.env.B2_KEY_ID || "",
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY || "",
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || "vaultrom-files",
  B2_REGION: process.env.B2_REGION || "us-west-004",
  B2_PUBLIC_URL: process.env.B2_PUBLIC_URL || "",
  SITE_ID: process.env.SITE_ID || "vaultrom",
  SITE_NAME: process.env.SITE_NAME || "VAULTROM",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@vaultrom.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "changeme123",
  CF_WORKER_URL: process.env.CF_WORKER_URL || "",
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || "",
} as const;
