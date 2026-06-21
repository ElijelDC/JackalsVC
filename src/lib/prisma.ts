import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
}

function createPrismaClient() {
  const dbUrl = resolveDatabaseUrl();
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

// Bump when schema changes so dev hot-reload picks up a fresh client.
const PRISMA_SCHEMA_VERSION = 17;

function isPrismaClientCurrent(client: PrismaClient) {
  return (
    typeof client.clubTeam?.findMany === "function" &&
    typeof client.clubTeamMember?.findMany === "function" &&
    typeof client.galleryAlbum?.findMany === "function" &&
    typeof client.achievement?.findMany === "function" &&
    typeof client.registrationCode?.findMany === "function" &&
    typeof client.paymentImportRecord?.findMany === "function"
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
    isPrismaClientCurrent(cached)
  ) {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
}

export const prisma = getPrismaClient();
