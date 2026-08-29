/**
 * Idempotent bootstrap for production head coaches (Brijesh + Zubin).
 *
 * Creates User (role MEMBER) + ClubMember (rosterRole COACH) linked together,
 * assigns all three squads, and sets head-coach priority (0) per squad.
 *
 * Usage (production only):
 *   ALLOW_PRODUCTION_COACH_SEED=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/create-production-coaches.ts
 *
 * Do NOT run against local/dev — use scripts/setup-local-coach-cover-demo.ts instead
 * (fake @jackalsvc.com emails). Temporary passwords are printed once to stdout.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const ALL_SQUADS = ["DIV2_MENS", "DIV3_WOMENS", "DIV4_MENS"] as const;

type CoachSeed = {
  name: string;
  email: string;
  /** Null until VLYC is issued — coaches set it later on their profile. */
  vlyNumber: string | null;
  coachPaymentType: "PAID" | "VOLUNTEER";
  /** Squad key → priority (0 = head coach, 100 = cover). */
  priorities: Record<(typeof ALL_SQUADS)[number], number>;
};

const coaches: CoachSeed[] = [
  {
    name: "Brijesh Talaviya",
    email: "brijesh.talaviya99@gmail.com",
    vlyNumber: null,
    coachPaymentType: "PAID",
    priorities: {
      DIV2_MENS: 100,
      DIV3_WOMENS: 0,
      DIV4_MENS: 100,
    },
  },
  {
    name: "Zubin",
    email: "mattzubin@gmail.com",
    vlyNumber: null,
    coachPaymentType: "PAID",
    priorities: {
      DIV2_MENS: 0,
      DIV3_WOMENS: 100,
      DIV4_MENS: 100,
    },
  },
];

function tempPassword() {
  return randomBytes(12).toString("base64url");
}

async function upsertCoach(seed: CoachSeed) {
  const email = seed.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const password = existingUser ? null : tempPassword();
  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : existingUser!.passwordHash;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: seed.name,
      role: "MEMBER",
    },
    create: {
      name: seed.name,
      email,
      role: "MEMBER",
      passwordHash,
    },
  });

  const byVly =
    seed.vlyNumber != null
      ? await prisma.clubMember.findUnique({
          where: { vlyNumber: seed.vlyNumber },
        })
      : null;
  const byUser = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

  if (byVly && byUser && byVly.id !== byUser.id) {
    throw new Error(
      `Conflict: VLY ${seed.vlyNumber} and email ${email} point at different ClubMembers`,
    );
  }

  const memberId = byVly?.id ?? byUser?.id;
  const clubMember = memberId
    ? await prisma.clubMember.update({
        where: { id: memberId },
        data: {
          // Keep an existing real VLYC if already set; otherwise leave/null as seeded.
          ...(seed.vlyNumber != null || byUser?.vlyNumber == null
            ? { vlyNumber: seed.vlyNumber }
            : {}),
          name: seed.name,
          active: true,
          rosterRole: "COACH",
          coachPaymentType: seed.coachPaymentType,
          trainingTeamKey: ALL_SQUADS[0],
          userId: user.id,
          playerNumber: null,
        },
      })
    : await prisma.clubMember.create({
        data: {
          vlyNumber: seed.vlyNumber,
          name: seed.name,
          active: true,
          rosterRole: "COACH",
          coachPaymentType: seed.coachPaymentType,
          trainingTeamKey: ALL_SQUADS[0],
          userId: user.id,
          playerNumber: null,
        },
      });

  await prisma.clubMemberCoachSquad.deleteMany({
    where: { clubMemberId: clubMember.id },
  });
  await prisma.clubMemberCoachSquad.createMany({
    data: ALL_SQUADS.map((trainingTeamKey) => ({
      clubMemberId: clubMember.id,
      trainingTeamKey,
      priority: seed.priorities[trainingTeamKey],
    })),
  });

  // Ensure exclusive head (priority 0) per squad for this seed's head assignments.
  for (const trainingTeamKey of ALL_SQUADS) {
    if (seed.priorities[trainingTeamKey] !== 0) continue;
    await prisma.clubMemberCoachSquad.updateMany({
      where: {
        trainingTeamKey,
        clubMemberId: { not: clubMember.id },
        priority: 0,
      },
      data: { priority: 100 },
    });
  }

  return {
    name: seed.name,
    email,
    vlyNumber: seed.vlyNumber,
    password,
    createdUser: !existingUser,
    clubMemberId: clubMember.id,
    priorities: seed.priorities,
  };
}

async function main() {
  const allow = process.env.ALLOW_PRODUCTION_COACH_SEED === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost") ||
      process.env.NODE_ENV === "development");

  if (!allow || looksLocal) {
    throw new Error(
      "Refusing to seed real coach emails. For local testing use:\n" +
        "  DATABASE_URL=file:./prisma/dev.db npx tsx scripts/setup-local-coach-cover-demo.ts\n" +
        "For production only:\n" +
        "  ALLOW_PRODUCTION_COACH_SEED=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/create-production-coaches.ts",
    );
  }

  const results = [];
  for (const seed of coaches) {
    results.push(await upsertCoach(seed));
  }

  console.log("Production coaches ready:\n");
  for (const row of results) {
    console.log(`- ${row.name} <${row.email}>`);
    console.log(`  VLYC: ${row.vlyNumber ?? "(not set yet — add on profile)"}`);
    console.log(
      `  Head for: ${Object.entries(row.priorities)
        .filter(([, p]) => p === 0)
        .map(([k]) => k)
        .join(", ") || "(none)"}`,
    );
    if (row.password) {
      console.log(`  Temporary password: ${row.password}`);
    } else {
      console.log("  Temporary password: (unchanged — user already existed)");
    }
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
