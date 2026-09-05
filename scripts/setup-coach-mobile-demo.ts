/**
 * Demo data for the coach mobile walkthrough video.
 *
 * Creates coach.demo@jackalsvc.com (head D2M, cover D3W) with upcoming
 * training, matches, player responses, VLY photos, and payment records.
 *
 *   npx tsx scripts/seed-test-users.ts
 *   npx tsx scripts/setup-coach-mobile-demo.ts
 */
import bcrypt from "bcryptjs";
import { addDays, addMinutes, startOfMonth } from "date-fns";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { syncAllTrainingSessionEvents } from "../src/lib/training-events";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "coach.demo@jackalsvc.com";
const DEMO_PASSWORD = process.env.COACH_DEMO_PASSWORD?.trim() || "coachdemo123";
const HEAD_SQUAD = "DIV2_MENS";
const COVER_SQUAD = "DIV3_WOMENS";
const HEAD_COACH_EMAIL = "emma.williams@jackalsvc.com";
const DEMO_VLY_PHOTO = "/brand/logo.png";

async function ensureDemoCoach() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: "Coach Demo",
        passwordHash,
        role: "MEMBER",
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, name: "Coach Demo" },
    });
  }

  let member = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

  if (!member) {
    member = await prisma.clubMember.create({
      data: {
        userId: user.id,
        name: "Coach Demo",
        vlyNumber: "VLYC88001",
        rosterRole: "COACH",
        coachPaymentType: "PAID",
        trainingTeamKey: HEAD_SQUAD,
        active: true,
      },
    });
  } else {
    member = await prisma.clubMember.update({
      where: { id: member.id },
      data: {
        rosterRole: "COACH",
        coachPaymentType: "PAID",
        trainingTeamKey: HEAD_SQUAD,
        active: true,
      },
    });
  }

  await prisma.clubMemberCoachSquad.deleteMany({
    where: { clubMemberId: member.id },
  });
  await prisma.clubMemberCoachSquad.createMany({
    data: [
      { clubMemberId: member.id, trainingTeamKey: HEAD_SQUAD, priority: 0 },
      { clubMemberId: member.id, trainingTeamKey: COVER_SQUAD, priority: 100 },
    ],
  });

  return { user, member };
}

/** Emma Williams is head coach on D3W so the demo cover coach sees the priority gate. */
async function ensureHeadCoachForCoverSquad() {
  const headUser = await prisma.user.findUnique({
    where: { email: HEAD_COACH_EMAIL },
  });
  if (!headUser) {
    console.warn(`Head coach user ${HEAD_COACH_EMAIL} not found — run seed-test-users first.`);
    return null;
  }

  const headMember = await prisma.clubMember.findFirst({
    where: { userId: headUser.id, rosterRole: "COACH" },
  });
  if (!headMember) return null;

  await prisma.clubMemberCoachSquad.deleteMany({
    where: {
      trainingTeamKey: COVER_SQUAD,
      clubMemberId: { not: headMember.id },
      priority: 0,
    },
  });

  await prisma.clubMemberCoachSquad.upsert({
    where: {
      clubMemberId_trainingTeamKey: {
        clubMemberId: headMember.id,
        trainingTeamKey: COVER_SQUAD,
      },
    },
    create: {
      clubMemberId: headMember.id,
      trainingTeamKey: COVER_SQUAD,
      priority: 0,
    },
    update: { priority: 0 },
  });

  return headUser;
}

async function ensureWeeklySessions() {
  const squads = [
    { key: HEAD_SQUAD, title: "Division 2 Mens Training", dayOfWeek: 2 },
    { key: COVER_SQUAD, title: "Division 3 Womens Training", dayOfWeek: 1 },
  ];

  const recurringFrom = startOfMonth(new Date());
  const recurringTo = addDays(new Date(), 120);

  for (const squad of squads) {
    const existing = await prisma.trainingSession.findFirst({
      where: { category: "WEEKLY", trainingTeamKey: squad.key },
    });

    if (existing) {
      await prisma.trainingSession.update({
        where: { id: existing.id },
        data: {
          startTime: "19:00",
          endTime: "21:00",
          location: "Meakstown",
          recurring: true,
          recurrenceWeeks: 1,
          recurringFrom,
          recurringTo,
          dayOfWeek: squad.dayOfWeek,
        },
      });
    } else {
      await prisma.trainingSession.create({
        data: {
          category: "WEEKLY",
          trainingTeamKey: squad.key,
          title: squad.title,
          dayOfWeek: squad.dayOfWeek,
          startTime: "19:00",
          endTime: "21:00",
          location: "Meakstown",
          level: "",
          recurring: true,
          recurrenceWeeks: 1,
          recurringFrom,
          recurringTo,
        },
      });
    }
  }

  await syncAllTrainingSessionEvents();
}

async function ensureUpcomingMatches() {
  const now = new Date();
  const fixtures = [
    {
      trainingTeamKey: HEAD_SQUAD,
      opponentName: "UCD Volleyball",
      venue: "HOME",
      location: "Meakstown",
      daysFromNow: 12,
    },
    {
      trainingTeamKey: COVER_SQUAD,
      opponentName: "Trinity VC",
      venue: "AWAY",
      location: "Trinity Sports Centre",
      daysFromNow: 19,
    },
  ];

  for (const fixture of fixtures) {
    const matchStart = addDays(now, fixture.daysFromNow);
    matchStart.setHours(14, 0, 0, 0);
    const warmUpTime = addMinutes(matchStart, -30);

    const existing = await prisma.teamMatch.findFirst({
      where: {
        trainingTeamKey: fixture.trainingTeamKey,
        opponentName: fixture.opponentName,
        matchStart: { gte: now },
      },
    });

    if (!existing) {
      await prisma.teamMatch.create({
        data: {
          trainingTeamKey: fixture.trainingTeamKey,
          opponentName: fixture.opponentName,
          venue: fixture.venue,
          location: fixture.location,
          warmUpTime,
          matchStart,
          notes: "Demo fixture for coach app video",
        },
      });
    }
  }
}

async function seedPlayerVlyPhotos() {
  const players = await prisma.clubMember.findMany({
    where: {
      rosterRole: "PLAYER",
      active: true,
      trainingTeamKey: HEAD_SQUAD,
      userId: { not: null },
    },
    select: { id: true },
  });

  for (const [index, player] of players.entries()) {
    await prisma.clubMember.update({
      where: { id: player.id },
      data: {
        vlyMembershipPhotoUrl: DEMO_VLY_PHOTO,
        playerNumber: index + 1,
      },
    });
  }
}

async function seedTrainingAttendance(
  coachUserId: string,
  headCoachUserId: string | null,
) {
  const now = new Date();
  const upcomingEvents = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      startDate: { gte: now, lte: addDays(now, 21) },
      trainingSession: {
        trainingTeamKey: { in: [HEAD_SQUAD, COVER_SQUAD] },
      },
    },
    include: {
      trainingSession: { select: { trainingTeamKey: true } },
    },
    orderBy: { startDate: "asc" },
    take: 6,
  });

  const players = await prisma.clubMember.findMany({
    where: {
      rosterRole: "PLAYER",
      active: true,
      trainingTeamKey: { in: [HEAD_SQUAD, COVER_SQUAD] },
      userId: { not: null },
    },
    select: { userId: true, trainingTeamKey: true },
  });

  for (const event of upcomingEvents) {
    const squadKey = event.trainingSession?.trainingTeamKey ?? null;

    if (squadKey === COVER_SQUAD) {
      // Cover squad: head coach unanswered so demo cover coach sees the priority gate.
      await prisma.eventSignup.deleteMany({
        where: {
          eventId: event.id,
          userId: { in: [coachUserId, ...(headCoachUserId ? [headCoachUserId] : [])] },
        },
      });
    } else if (squadKey === HEAD_SQUAD) {
      await prisma.eventSignup.upsert({
        where: { userId_eventId: { userId: coachUserId, eventId: event.id } },
        create: { userId: coachUserId, eventId: event.id, status: "ATTENDING" },
        update: { status: "ATTENDING" },
      });
    }

    const squadPlayers = players.filter(
      (player) => player.trainingTeamKey === squadKey && player.userId,
    );

    for (const [index, player] of squadPlayers.entries()) {
      if (!player.userId) continue;
      const status =
        index % 3 === 0
          ? "UNANSWERED"
          : index % 3 === 1
            ? "ATTENDING"
            : "NOT_ATTENDING";
      if (status === "UNANSWERED") continue;

      await prisma.eventSignup.upsert({
        where: {
          userId_eventId: { userId: player.userId, eventId: event.id },
        },
        create: { userId: player.userId, eventId: event.id, status },
        update: { status },
      });
    }
  }
}

async function seedMatchAttendance(coachUserId: string) {
  const now = new Date();
  const match = await prisma.teamMatch.findFirst({
    where: {
      trainingTeamKey: HEAD_SQUAD,
      matchStart: { gte: now },
    },
    orderBy: { matchStart: "asc" },
  });
  if (!match) return;

  const players = await prisma.clubMember.findMany({
    where: {
      rosterRole: "PLAYER",
      active: true,
      trainingTeamKey: HEAD_SQUAD,
      userId: { not: null },
    },
    select: { userId: true },
  });

  await prisma.matchSignup.upsert({
    where: { userId_matchId: { userId: coachUserId, matchId: match.id } },
    create: { userId: coachUserId, matchId: match.id, status: "ATTENDING" },
    update: { status: "ATTENDING" },
  });

  for (const [index, player] of players.entries()) {
    if (!player.userId) continue;
    const status =
      index % 3 === 0
        ? "UNANSWERED"
        : index % 3 === 1
          ? "ATTENDING"
          : "NOT_ATTENDING";
    if (status === "UNANSWERED") continue;

    await prisma.matchSignup.upsert({
      where: { userId_matchId: { userId: player.userId, matchId: match.id } },
      create: { userId: player.userId, matchId: match.id, status },
      update: { status },
    });
  }
}

async function seedPayments(clubMemberId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  await prisma.coachSalaryPayment.upsert({
    where: {
      clubMemberId_year_month: {
        clubMemberId,
        year: prevYear,
        month: prevMonth,
      },
    },
    create: {
      clubMemberId,
      year: prevYear,
      month: prevMonth,
      sessionCount: 4,
      ratePerSession: 25,
      amount: 100,
      status: "PAID",
      paidAt: addDays(startOfMonth(now), 5),
      notes: "Demo paid month",
    },
    update: {
      sessionCount: 4,
      amount: 100,
      status: "PAID",
      paidAt: addDays(startOfMonth(now), 5),
    },
  });

  await prisma.coachSalaryPayment.upsert({
    where: {
      clubMemberId_year_month: { clubMemberId, year, month },
    },
    create: {
      clubMemberId,
      year,
      month,
      sessionCount: 3,
      ratePerSession: 25,
      amount: 75,
      status: "PENDING",
    },
    update: {
      sessionCount: 3,
      amount: 75,
      status: "PENDING",
    },
  });
}

async function main() {
  console.log("Setting up coach mobile demo data...");
  const { user, member } = await ensureDemoCoach();
  console.log(`Coach: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  const headCoach = await ensureHeadCoachForCoverSquad();
  if (headCoach) {
    console.log(`Head coach for ${COVER_SQUAD}: ${HEAD_COACH_EMAIL}`);
  }

  await ensureWeeklySessions();
  console.log("Training sessions synced.");

  await ensureUpcomingMatches();
  console.log("Upcoming matches created.");

  await seedPlayerVlyPhotos();
  console.log("VLY membership photos set for D2M players.");

  await seedTrainingAttendance(user.id, headCoach?.id ?? null);
  console.log("Training attendance demo data ready.");

  await seedMatchAttendance(user.id);
  console.log("Match attendance demo data ready.");

  await seedPayments(member.id);
  console.log("Payment demo data ready.");
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
