import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === "development") {
  const p = prisma as unknown as { conversation?: unknown };
  if (typeof p.conversation === "undefined") {
    console.error(
      "[SmartLearn] Cliente Prisma desatualizado (falta o modelo Conversation). Para o `npm run dev`, corre `npx prisma generate` (e `npx prisma migrate deploy` se precisares), e volta a iniciar o dev server.",
    );
  }
}
