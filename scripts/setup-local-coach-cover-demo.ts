/**
 * Local demo coaches for head-coach cover flow testing.
 * Uses fake @jackalsvc.com emails only — never real coach Gmail addresses.
 *
 * Head: Demo Head Coach (DIV3_WOMENS priority 0)
 * Cover: Eli (elijel.delacruz@gmail.com, priority 100 on DIV3_WOMENS)
 *
 *   DATABASE_URL=file:./prisma/dev.db npx tsx scripts/setup-local-coach-cover-demo.ts
 */
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "coachdemo123";
const SQUAD = "DIV3_WOMENS" as const;
const ALL_SQUADS = ["DIV2_MENS", "DIV3_WOMENS", "DIV4_MENS"] as const;

/** Real coach inboxes — scrub these from local coach squads so SMTP never hits them. */
const REAL_COACH_EMAILS = [
  "brijesh.talaviya99@gmail.com",
  "mattzubin@gmail.com",
  "chvinzons@gmail.com",
  "orestisal97@gmail.com",
  "rost.ovtseva226@gmail.com",
];

type Seed = {
  name: string;
  email: string;
  vlyNumber: string;
  priorities: Record<(typeof ALL_SQUADS)[number], number>;
};

const seeds: Seed[] = [
  {
    name: "Demo Head Coach (D3W)",
    email: "head.coach.d3w@jackalsvc.com",
    vlyNumber: "VLYC90001",
    priorities: {
      DIV2_MENS: 100,
      DIV3_WOMENS: 0,
      DIV4_MENS: 100,
    },
  },
  {
    name: "Demo Cover Coach (D2M)",
    email: "head.coach.d2m@jackalsvc.com",
    vlyNumber: "VLYC90002",
    priorities: {
      DIV2_MENS: 0,
      DIV3_WOMENS: 100,
      DIV4_MENS: 100,
    },
  },
  {
    name: "Eli De La Cruz",
    email: "elijel.delacruz@gmail.com",
    vlyNumber: "VLYC20003",
    priorities: {
      DIV2_MENS: 100,
      DIV3_WOMENS: 100,
      DIV4_MENS: 100,
    },
  },
];

function tempPassword() {
  return process.env.COACH_DEMO_PASSWORD?.trim() || DEMO_PASSWORD;
}

async function scrubRealCoachEmailsFromLocal() {
  for (const raw of REAL_COACH_EMAILS) {
    const email = raw.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
    if (!user) continue;

    const members = await prisma.clubMember.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const memberIds = members.map((m) => m.id);

    if (memberIds.length > 0) {
      await prisma.clubMemberCoachSquad.deleteMany({
        where: { clubMemberId: { in: memberIds } },
      });
      await prisma.clubMember.updateMany({
        where: { id: { in: memberIds } },
        data: {
          rosterRole: "PLAYER",
          coachPaymentType: null,
          trainingTeamKey: null,
          active: false,
        },
      });
    }

    // Detach login so local tests can't accidentally notify this inbox again.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: `scrubbed+${email.replace("@", ".at.")}@jackalsvc.invalid`,
        name: `${user.name} (scrubbed local)`,
      },
    });

    console.log(`Scrubbed real coach email from local DB: ${email}`);
  }
}

async function upsertCoach(seed: Seed, password: string) {
  const email = seed.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: seed.name, role: "MEMBER", passwordHash },
    create: {
      name: seed.name,
      email,
      role: "MEMBER",
      passwordHash,
    },
  });

  const byVly = await prisma.clubMember.findUnique({
    where: { vlyNumber: seed.vlyNumber },
  });
  const byUser = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

  if (byVly && byUser && byVly.id !== byUser.id) {
    throw new Error(
      `Conflict linking ${email} / ${seed.vlyNumber} to ClubMember`,
    );
  }

  const memberId = byVly?.id ?? byUser?.id;
  const clubMember = memberId
    ? await prisma.clubMember.update({
        where: { id: memberId },
        data: {
          vlyNumber: seed.vlyNumber,
          name: seed.name,
          active: true,
          rosterRole: "COACH",
          coachPaymentType: "PAID",
          trainingTeamKey: SQUAD,
          userId: user.id,
        },
      })
    : await prisma.clubMember.create({
        data: {
          vlyNumber: seed.vlyNumber,
          name: seed.name,
          active: true,
          rosterRole: "COACH",
          coachPaymentType: "PAID",
          trainingTeamKey: SQUAD,
          userId: user.id,
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

  return { userId: user.id, email, name: seed.name, vlyNumber: seed.vlyNumber };
}

async function ensureUpcomingDiv3Session() {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(21, 0, 0, 0);

  let session = await prisma.trainingSession.findFirst({
    where: { trainingTeamKey: SQUAD },
  });

  if (!session) {
    session = await prisma.trainingSession.create({
      data: {
        title: "Division 3 Womens Training",
        trainingTeamKey: SQUAD,
        location: "Local demo court",
        dayOfWeek: start.getDay(),
        startTime: "19:00",
        endTime: "21:00",
        level: "All levels",
        category: "WEEKLY",
        recurring: true,
      },
    });
  }

  const existing = await prisma.event.findFirst({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gt: new Date() },
      title: { contains: "Coach cover demo" },
    },
  });

  if (existing) {
    return prisma.event.update({
      where: { id: existing.id },
      data: { startDate: start, endDate: end },
    });
  }

  return prisma.event.create({
    data: {
      title: "Coach cover demo — Div 3 Womens",
      description: "Local test session for head-coach decline → cover email",
      type: "TRAINING",
      startDate: start,
      endDate: end,
      location: session.location || "Local demo court",
      trainingSessionId: session.id,
      trainingOccurrenceDate: start,
    },
  });
}

async function main() {
  await scrubRealCoachEmailsFromLocal();

  const password = tempPassword();
  const results = [];
  for (const seed of seeds) {
    results.push(await upsertCoach(seed, password));
  }

  const event = await ensureUpcomingDiv3Session();

  // Clear coach responses on the demo event so the head-first flow is retestable.
  const coachUserIds = results.map((row) => row.userId);
  await prisma.eventSignup.deleteMany({
    where: { eventId: event.id, userId: { in: coachUserIds } },
  });

  console.log("Local coach cover demo ready\n");
  console.log(`Password for all demo coaches: ${password}\n`);
  for (const row of results) {
    console.log(`- ${row.name} <${row.email}>  VLY ${row.vlyNumber}`);
  }
  console.log("");
  console.log(`Squad: ${SQUAD}`);
  console.log(`Event id: ${event.id}`);
  console.log(`Event: ${event.title}`);
  console.log(`Starts: ${event.startDate.toISOString()}`);
  console.log(`Session URL: /training/session/${event.id}`);
  console.log(`Calendar URL: /calendar/${event.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
