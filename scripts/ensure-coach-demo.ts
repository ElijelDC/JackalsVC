import "dotenv/config";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const COACH_EMAIL = "coach@jackalsvc.com";
const COACH_PASSWORD = "password123";
const COACH_VLY = "VLY10012";

async function main() {
  const passwordHash = await bcrypt.hash(COACH_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: COACH_EMAIL },
    update: {
      name: "Coach Demo",
      role: "MEMBER",
      passwordHash,
    },
    create: {
      name: "Coach Demo",
      email: COACH_EMAIL,
      role: "MEMBER",
      passwordHash,
    },
  });

  const existingMember = await prisma.clubMember.findUnique({
    where: { vlyNumber: COACH_VLY },
  });

  if (existingMember) {
    await prisma.clubMember.update({
      where: { id: existingMember.id },
      data: {
        name: "Coach Demo",
        active: true,
        rosterRole: "COACH",
        trainingTeamKey: "DIV2_MENS",
        userId: user.id,
      },
    });
  } else {
    await prisma.clubMember.create({
      data: {
        vlyNumber: COACH_VLY,
        name: "Coach Demo",
        active: true,
        rosterRole: "COACH",
        trainingTeamKey: "DIV2_MENS",
        userId: user.id,
      },
    });
  }

  const clubMember = await prisma.clubMember.findUnique({
    where: { userId: user.id },
  });

  const adultPlan = await prisma.membershipPlan.findFirst({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  if (adultPlan) {
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, endDate: { gt: new Date() } },
    });

    if (existingMembership) {
      if (existingMembership.status !== "COACH") {
        await prisma.membership.update({
          where: { id: existingMembership.id },
          data: { status: "COACH" },
        });
      }
    } else {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 7);
      await prisma.membership.create({
        data: {
          userId: user.id,
          planId: adultPlan.id,
          paymentSchedule: "FULL",
          status: "COACH",
          endDate,
        },
      });
    }
  }

  if (clubMember) {
    const now = new Date();
    await prisma.coachSalaryPayment.upsert({
      where: {
        clubMemberId_year_month: {
          clubMemberId: clubMember.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      },
      update: {},
      create: {
        clubMemberId: clubMember.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        sessionCount: 4,
        ratePerSession: 25,
        amount: 100,
        status: "PENDING",
      },
    });
  }

  console.log(`Coach account ready: ${COACH_EMAIL} / ${COACH_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
