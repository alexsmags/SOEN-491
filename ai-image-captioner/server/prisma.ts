// server/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // add "query" if you want verbose SQL in dev
  });

// cache the client in dev to survive hot reloads without creating new instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
