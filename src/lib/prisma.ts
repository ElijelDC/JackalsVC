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
const PRISMA_SCHEMA_VERSION = 55;

type RuntimeModel = {
  fields: { name: string }[];
};

function clientHasModelField(
  client: PrismaClient,
  modelName: string,
  fieldName: string,
) {
  const runtimeModel = (
    client as {
      _runtimeDataModel?: {
        models: Record<string, RuntimeModel>;
      };
    }
  )._runtimeDataModel;

  return Boolean(
    runtimeModel?.models?.[modelName]?.fields.some(
      (field) => field.name === fieldName,
    ),
  );
}

function isPrismaClientCurrent(client: PrismaClient) {
  return (
    typeof client.clubTeam?.findMany === "function" &&
    typeof client.clubTeamMember?.findMany === "function" &&
    typeof client.galleryAlbum?.findMany === "function" &&
    typeof client.achievement?.findMany === "function" &&
    typeof client.registrationCode?.findMany === "function" &&
    typeof client.paymentImportRecord?.findMany === "function" &&
    typeof client.clubMember?.findMany === "function" &&
    typeof client.emailVerification?.findMany === "function" &&
    typeof client.teamMatch?.findMany === "function" &&
    typeof client.matchSignup?.findMany === "function" &&
    typeof client.siteContent?.findMany === "function" &&
    typeof client.coachingApplication?.findMany === "function" &&
    typeof client.trialsApplication?.findMany === "function" &&
    typeof client.clubOfferAcceptance?.findMany === "function" &&
    clientHasModelField(client, "ClubOfferAcceptance", "status") &&
    typeof client.clubMemberCoachSquad?.findMany === "function" &&
    typeof client.trainingSquad?.findMany === "function" &&
    clientHasModelField(client, "ClubMember", "profileImageUrl") &&
    clientHasModelField(client, "ClubMember", "rosterRole") &&
    clientHasModelField(client, "ClubMember", "coachPaymentType") &&
    clientHasModelField(client, "ClubMember", "vlyMembershipPhotoUrl") &&
    clientHasModelField(client, "ClubMember", "playerNumber") &&
    clientHasModelField(client, "ClubMember", "registrationReviewStatus") &&
    clientHasModelField(client, "ClubMember", "registrationPhotoSubmittedAt") &&
    clientHasModelField(client, "Event", "rulesPdfUrl") &&
    typeof client.coachSalaryPayment?.findMany === "function" &&
    typeof client.coachResponseReminder?.findUnique === "function" &&
    typeof client.tournamentWinnerPhoto?.findMany === "function" &&
    typeof client.tournamentCover?.findMany === "function" &&
    clientHasModelField(client, "ClubTeam", "trainingTeamKey") &&
    clientHasModelField(client, "ClubTeamMember", "clubMemberId") &&
    clientHasModelField(client, "ClubTeamMember", "isCaptain") &&
    clientHasModelField(client, "GalleryAlbum", "tournamentSlug") &&
    typeof client.trialSession?.findUnique === "function" &&
    typeof client.trialSessionSignup?.findMany === "function" &&
    typeof client.trialSessionPaymentProof?.findMany === "function" &&
    typeof client.trialSessionReminder?.findMany === "function" &&
    typeof client.coachOfferAcceptance?.findMany === "function" &&
    clientHasModelField(client, "CoachOfferAcceptance", "poloMaterial") &&
    typeof client.kitOrder?.findMany === "function" &&
    clientHasModelField(client, "KitOrder", "trainingTshirt") &&
    clientHasModelField(client, "KitOrder", "playerJersey") &&
    clientHasModelField(client, "KitOrder", "phoneNumber") &&
    clientHasModelField(client, "KitOrder", "jacketFullZip")
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

  if (cached) {
    void cached.$disconnect();
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
