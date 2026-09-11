/**
 * Fills a demo member account so every dashboard panel has content.
 *
 *   DATABASE_URL=file:/data/jackals.db npx tsx scripts/setup-dashboard-demo-member.ts
 */
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

function vodKey(teamKey: string, kind: "training" | "matches") {
  return `vod.playlist.${teamKey}.${kind}`;
}

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo.dashboard@jackalsvc.com";
const DEMO_PASSWORD = process.env.DASHBOARD_DEMO_PASSWORD?.trim() || "DemoDash123!";
const DEMO_NAME = "Dashboard Demo";
const DEMO_VLY = "VLYD88001";
const TEAM_KEY = "DIV2_MENS";

function atTime(base: Date, hour: number, minute = 0) {
  return setMinutes(setHours(base, hour), minute);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      name: DEMO_NAME,
      role: "MEMBER",
      passwordHash,
    },
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      role: "MEMBER",
      passwordHash,
    },
  });

  const existingByVly = await prisma.clubMember.findUnique({
    where: { vlyNumber: DEMO_VLY },
  });
  const existingByUser = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

  let member = existingByUser ?? existingByVly;
  if (!member) {
    member = await prisma.clubMember.create({
      data: {
        userId: user.id,
        name: DEMO_NAME,
        vlyNumber: DEMO_VLY,
        rosterRole: "PLAYER",
        playerPaymentType: "MEMBERSHIP",
        trainingTeamKey: TEAM_KEY,
        active: true,
      },
    });
  } else {
    member = await prisma.clubMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        name: DEMO_NAME,
        rosterRole: "PLAYER",
        playerPaymentType: "MEMBERSHIP",
        trainingTeamKey: TEAM_KEY,
        active: true,
      },
    });
  }

  const plan =
    (await prisma.membershipPlan.findFirst({
      where: { active: true },
      orderBy: { price: "desc" },
    })) ??
    (await prisma.membershipPlan.create({
      data: {
        name: "Adult",
        description: "Full season membership",
        price: 365,
        durationMonths: 12,
        features: "[]",
        active: true,
      },
    }));

  await prisma.payment.deleteMany({
    where: {
      userId: user.id,
      paymentReference: { startsWith: "DEMO-DASH-" },
    },
  });
  await prisma.membership.deleteMany({ where: { userId: user.id } });

  const seasonEnd = addDays(now, 220);
  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      planId: plan.id,
      paymentSchedule: "INSTALLMENTS",
      status: "ACTIVE",
      startDate: addDays(now, -40),
      endDate: seasonEnd,
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        userId: user.id,
        membershipId: membership.id,
        amount: 125,
        description: "Membership instalment 1",
        status: "COMPLETED",
        method: "BANK_TRANSFER",
        paymentReference: "DEMO-DASH-1",
        installmentNumber: 1,
        dueDate: addDays(now, -30),
        paidAt: addDays(now, -28),
      },
      {
        userId: user.id,
        membershipId: membership.id,
        amount: 120,
        description: "Membership instalment 2",
        status: "PENDING",
        method: "BANK_TRANSFER",
        paymentReference: "DEMO-DASH-2",
        installmentNumber: 2,
        dueDate: addDays(now, 12),
      },
      {
        userId: user.id,
        membershipId: membership.id,
        amount: 120,
        description: "Membership instalment 3",
        status: "PENDING",
        method: "BANK_TRANSFER",
        paymentReference: "DEMO-DASH-3",
        installmentNumber: 3,
        dueDate: addDays(now, 70),
      },
    ],
  });

  await prisma.matchSignup.deleteMany({
    where: {
      userId: user.id,
      match: { notes: "dashboard-demo" },
    },
  });
  await prisma.teamMatch.deleteMany({
    where: { notes: "dashboard-demo", trainingTeamKey: TEAM_KEY },
  });

  const matchOneStart = atTime(addDays(startOfDay(now), 5), 14, 0);
  const matchTwoStart = atTime(addDays(startOfDay(now), 12), 15, 30);

  const matchOne = await prisma.teamMatch.create({
    data: {
      trainingTeamKey: TEAM_KEY,
      opponentName: "Demo Athletic",
      venue: "HOME",
      location: "Luttrellstown",
      warmUpTime: atTime(addDays(startOfDay(now), 5), 13, 15),
      matchStart: matchOneStart,
      notes: "dashboard-demo",
    },
  });
  const matchTwo = await prisma.teamMatch.create({
    data: {
      trainingTeamKey: TEAM_KEY,
      opponentName: "Sample Vikings",
      venue: "AWAY",
      location: "UCD Sport",
      warmUpTime: atTime(addDays(startOfDay(now), 12), 14, 45),
      matchStart: matchTwoStart,
      notes: "dashboard-demo",
    },
  });

  await prisma.matchSignup.createMany({
    data: [
      { userId: user.id, matchId: matchOne.id, status: "ATTENDING" },
      { userId: user.id, matchId: matchTwo.id, status: "PENDING" },
    ],
  });

  await prisma.event.deleteMany({
    where: {
      OR: [
        { title: { startsWith: "[Demo]" } },
        { description: "dashboard-demo-event" },
      ],
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: "[Demo] Squad social night",
        description: "dashboard-demo-event",
        type: "SOCIAL",
        location: "Clubhouse · Meakstown",
        startDate: atTime(addDays(startOfDay(now), 8), 19, 0),
        endDate: atTime(addDays(startOfDay(now), 8), 22, 0),
      },
      {
        title: "[Demo] Skills clinic",
        description: "dashboard-demo-event",
        type: "SKILLS_CLINIC",
        location: "Meakstown Sports Hall",
        startDate: atTime(addDays(startOfDay(now), 18), 18, 0),
        endDate: atTime(addDays(startOfDay(now), 18), 20, 0),
      },
      {
        title: "[Demo] Mini tournament",
        description: "dashboard-demo-event",
        type: "TOURNAMENT",
        location: "Luttrellstown",
        startDate: atTime(addDays(startOfDay(now), 25), 10, 0),
        endDate: atTime(addDays(startOfDay(now), 25), 16, 0),
      },
    ],
  });

  const trainingUrl = "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMOVuxt7RULOAxWbG";
  const matchesUrl = "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMOzxt7RULOAxWbH";

  await prisma.siteContent.upsert({
    where: { key: vodKey(TEAM_KEY, "training") },
    update: { value: trainingUrl },
    create: {
      key: vodKey(TEAM_KEY, "training"),
      value: trainingUrl,
    },
  });
  await prisma.siteContent.upsert({
    where: { key: vodKey(TEAM_KEY, "matches") },
    update: { value: matchesUrl },
    create: {
      key: vodKey(TEAM_KEY, "matches"),
      value: matchesUrl,
    },
  });

  const nextTrainings = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      startDate: { gte: now, lte: addDays(now, 14) },
      trainingSession: { trainingTeamKey: TEAM_KEY },
    },
    orderBy: { startDate: "asc" },
    take: 3,
    select: { id: true, title: true, startDate: true },
  });

  console.log("Dashboard demo member ready");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Squad:    ${TEAM_KEY}`);
  console.log(`  Membership: ACTIVE instalments on ${plan.name}`);
  console.log(`  Demo matches: ${matchOne.opponentName}, ${matchTwo.opponentName}`);
  console.log(`  Club events: 3 demo events (social / clinic / tournament)`);
  console.log(`  VOD playlists: set for ${TEAM_KEY}`);
  console.log(
    `  Upcoming training found: ${nextTrainings.length} (uses live weekly schedule)`,
  );
  if (nextTrainings.length === 0) {
    console.log(
      "  Warning: no upcoming DIV2 training in the next 14 days — sync training events if needed.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
