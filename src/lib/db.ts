// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Prevent Prisma Client from running in browser environments
if (typeof window !== "undefined") {
  throw new Error("PrismaClient should not be used in the browser environment");
}

// Global variable to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

// Create a Prisma client with the Accelerate extension for edge environments
const prisma =
  globalForPrisma.prisma ?? new PrismaClient().$extends(withAccelerate());

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
