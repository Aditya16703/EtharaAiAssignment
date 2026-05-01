import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === "development"
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ]
      : [{ emit: "stdout", level: "error" }],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;

  // Log slow queries (> 200ms) in dev
  (prisma as any).$on("query", (e: any) => {
    if (e.duration > 200) {
      console.warn(`⚠ Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}
