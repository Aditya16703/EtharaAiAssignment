import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`✓ Database connected`);
    console.log(`✓ Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  } catch (error) {
    console.error("✗ Failed to connect to database:", error);
    process.exit(1);
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    console.log("✓ HTTP server closed");
    await prisma.$disconnect();
    console.log("✓ Database disconnected");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("✗ Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  console.error("✗ Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("✗ Unhandled rejection:", reason);
  process.exit(1);
});
