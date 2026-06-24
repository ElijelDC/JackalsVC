/**
 * Idempotent test users for staging / first-time production bootstrap.
 * Run on Fly: DATABASE_URL=file:/data/jackals.db node scripts/seed-test-users.mjs
 */
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const TEST_PASSWORD = "password123";

const defaultSquads = [
  { key: "DIV2_MENS", name: "Division 2 Mens", dayOfWeek: 4, sortOrder: 0 },
  { key: "DIV3_WOMENS", name: "Division 3 Womens", dayOfWeek: 1, sortOrder: 1 },
  { key: "DIV4_MENS", name: "Division 4 Mens", dayOfWeek: 3, sortOrder: 2 },
];

const demoUsers = [
  { name: "Club Admin", email: "admin@jackalsvc.com", role: "ADMIN" },
  { name: "Demo Member", email: "member@jackalsvc.com", role: "MEMBER" },
  { name: "Sarah Jones", email: "sarah.jones@jackalsvc.com", role: "MEMBER" },
  { name: "Mike Chen", email: "mike.chen@jackalsvc.com", role: "MEMBER" },
  { name: "Emma Williams", email: "emma.williams@jackalsvc.com", role: "MEMBER" },
  { name: "Coach Demo", email: "coach@jackalsvc.com", role: "MEMBER" },
  { name: "James Patel", email: "james.patel@jackalsvc.com", role: "MEMBER" },
  { name: "Olivia Brown", email: "olivia.brown@jackalsvc.com", role: "MEMBER" },
  { name: "Liam Davis", email: "liam.davis@jackalsvc.com", role: "MEMBER" },
  { name: "Sophie Taylor", email: "sophie.taylor@jackalsvc.com", role: "MEMBER" },
  { name: "Alex Morgan", email: "alex.morgan@jackalsvc.com", role: "MEMBER" },
  { name: "Priya Sharma", email: "priya.sharma@jackalsvc.com", role: "MEMBER" },
  { name: "Noah Thompson", email: "noah.thompson@jackalsvc.com", role: "MEMBER" },
];

const rosterEntries = [
  { vlyNumber: "VLY10001", name: "Demo Member", email: "member@jackalsvc.com", trainingTeamKey: "DIV4_MENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10002", name: "Sarah Jones", email: "sarah.jones@jackalsvc.com", trainingTeamKey: "DIV3_WOMENS", rosterRole: "COACH", coachPaymentType: "VOLUNTEER" },
  { vlyNumber: "VLY10003", name: "Mike Chen", email: "mike.chen@jackalsvc.com", trainingTeamKey: "DIV2_MENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10004", name: "Emma Williams", email: "emma.williams@jackalsvc.com", trainingTeamKey: "DIV3_WOMENS", rosterRole: "COACH", coachPaymentType: "PAID" },
  { vlyNumber: "VLY10005", name: "James Patel", email: "james.patel@jackalsvc.com", trainingTeamKey: "DIV2_MENS", rosterRole: "COACH", coachPaymentType: "PAID" },
  { vlyNumber: "VLY10012", name: "Coach Demo", email: "coach@jackalsvc.com", trainingTeamKey: "DIV2_MENS", rosterRole: "COACH", coachPaymentType: "PAID" },
  { vlyNumber: "VLY10006", name: "Olivia Brown", email: "olivia.brown@jackalsvc.com", trainingTeamKey: "DIV3_WOMENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10007", name: "Liam Davis", email: "liam.davis@jackalsvc.com", trainingTeamKey: "DIV4_MENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10008", name: "Sophie Taylor", email: "sophie.taylor@jackalsvc.com", trainingTeamKey: "DIV3_WOMENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10009", name: "Alex Morgan", email: "alex.morgan@jackalsvc.com", trainingTeamKey: "DIV2_MENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10010", name: "Priya Sharma", email: "priya.sharma@jackalsvc.com", trainingTeamKey: "DIV3_WOMENS", rosterRole: "PLAYER" },
  { vlyNumber: "VLY10011", name: "Noah Thompson", email: "noah.thompson@jackalsvc.com", trainingTeamKey: "DIV4_MENS", rosterRole: "PLAYER" },
  {
    vlyNumber: "VLY10999",
    name: "New Member Test",
    email: null,
    trainingTeamKey: null,
    rosterRole: "PLAYER",
    registrationReviewStatus: null,
    registrationPhotoSubmittedAt: null,
    registrationReviewedAt: null,
    registrationReviewedByUserId: null,
  },
  {
    vlyNumber: "VLY10998",
    name: "Unregistered Step 2 Test",
    email: null,
    trainingTeamKey: null,
    rosterRole: "PLAYER",
    registrationReviewStatus: null,
    registrationPhotoSubmittedAt: null,
    registrationReviewedAt: null,
    registrationReviewedByUserId: null,
  },
];

const registrationCodes = [
  { code: "JACKALS-2026", label: "2026 Season — All Squads", maxUses: 100 },
  { code: "JACKALS-TRIAL", label: "Trial Session Players", maxUses: 20 },
  { code: "JACKALS-ADMIN", label: "Committee Only", maxUses: 5 },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  for (const squad of defaultSquads) {
    await prisma.trainingSquad.upsert({
      where: { key: squad.key },
      update: { name: squad.name, dayOfWeek: squad.dayOfWeek, sortOrder: squad.sortOrder },
      create: { ...squad, active: true },
    });
  }

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  for (const entry of rosterEntries) {
    const linkedUser = entry.email
      ? await prisma.user.findUnique({ where: { email: entry.email } })
      : null;

    await prisma.clubMember.upsert({
      where: { vlyNumber: entry.vlyNumber },
      update: {
        name: entry.name,
        active: true,
        rosterRole: entry.rosterRole,
        coachPaymentType:
          entry.rosterRole === "COACH"
            ? (entry.coachPaymentType ?? "PAID")
            : null,
        trainingTeamKey: entry.trainingTeamKey,
        userId: linkedUser?.id ?? null,
        vlyMembershipPhotoUrl: null,
        registrationReviewStatus: entry.registrationReviewStatus ?? null,
        registrationPhotoSubmittedAt: entry.registrationPhotoSubmittedAt ?? null,
        registrationReviewedAt: entry.registrationReviewedAt ?? null,
        registrationReviewedByUserId: entry.registrationReviewedByUserId ?? null,
      },
      create: {
        vlyNumber: entry.vlyNumber,
        name: entry.name,
        active: true,
        rosterRole: entry.rosterRole,
        coachPaymentType:
          entry.rosterRole === "COACH"
            ? (entry.coachPaymentType ?? "PAID")
            : null,
        trainingTeamKey: entry.trainingTeamKey,
        userId: linkedUser?.id ?? null,
        vlyMembershipPhotoUrl: null,
        registrationReviewStatus: entry.registrationReviewStatus ?? null,
        registrationPhotoSubmittedAt: entry.registrationPhotoSubmittedAt ?? null,
        registrationReviewedAt: entry.registrationReviewedAt ?? null,
        registrationReviewedByUserId: entry.registrationReviewedByUserId ?? null,
      },
    });
  }

  for (const reg of registrationCodes) {
    await prisma.registrationCode.upsert({
      where: { code: reg.code },
      update: { label: reg.label, maxUses: reg.maxUses, active: true },
      create: { ...reg, active: true },
    });
  }

  console.log(`Seeded ${demoUsers.length} test users (password: ${TEST_PASSWORD}).`);
  console.log("Admin: admin@jackalsvc.com");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
