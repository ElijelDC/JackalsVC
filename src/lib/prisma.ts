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
const PRISMA_SCHEMA_VERSION = 10;

function inlineSchemaIncludes(client: PrismaClient, marker: string) {
  const schema = (
    client as unknown as { _engineConfig?: { inlineSchema?: string } }
  )._engineConfig?.inlineSchema;
  return schema?.includes(marker) ?? false;
}

function isPrismaClientCurrent(client: PrismaClient) {
  return (
    typeof client.trainingOccurrenceException?.findUnique === "function" &&
    inlineSchemaIncludes(client, "clubIban")
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
