import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const dbUrl =
    process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

// Bump when schema changes so dev hot-reload picks up a fresh client.
const PRISMA_SCHEMA_VERSION = 16;

function isPrismaClientCurrent(client: PrismaClient) {
  return (
    typeof client.clubTeam?.findMany === "function" &&
    typeof client.clubTeamMember?.findMany === "function" &&
    typeof client.galleryAlbum?.findMany === "function" &&
    typeof client.achievement?.findMany === "function"
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
