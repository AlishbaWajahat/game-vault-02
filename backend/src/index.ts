import { env } from "./config/env";
import app from "./app";
import { prisma } from "./config/database";

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log("[DB] Connected to PostgreSQL");
  } catch (err) {
    console.error("[DB] Connection failed:", err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
