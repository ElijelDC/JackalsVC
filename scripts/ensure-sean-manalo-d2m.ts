/**
 * Ensure there is exactly one Sean Manalo account, linked to D2M, with no
 * duplicate User/ClubMember rows.
 *
 *   ALLOW_PRODUCTION_MEMBERSHIP_ADJUST=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/ensure-sean-manalo-d2m.ts
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const CANONICAL_EMAIL = "smanalo595@gmail.com";
const CANONICAL_NAME = "Sean Manalo";
const TEAM_KEY = "DIV2_MENS";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const allow = process.env.ALLOW_PRODUCTION_MEMBERSHIP_ADJUST === "1";
  const isProdPath = dbUrl.includes("/data/jackals.db");
  if (isProdPath && !allow) {
    throw new Error(
      "Refusing production adjust without ALLOW_PRODUCTION_MEMBERSHIP_ADJUST=1",
    );
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: CANONICAL_EMAIL },
        { name: CANONICAL_NAME },
        { email: { contains: "manalo" } },
        { name: { contains: "Manalo" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const members = await prisma.clubMember.findMany({
    where: {
      OR: [
        { name: CANONICAL_NAME },
        { name: { contains: "Manalo" } },
        { registrationContactEmail: CANONICAL_EMAIL },
        { registrationContactEmail: { contains: "manalo" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    "Found users:",
    users.map((u) => `${u.id} <${u.email}> ${u.name}`),
  );
  console.log(
    "Found members:",
    members.map(
      (m) =>
        `${m.id} ${m.name} team=${m.trainingTeamKey} userId=${m.userId ?? "null"}`,
    ),
  );

  const keepUser =
    users.find((u) => u.email.toLowerCase() === CANONICAL_EMAIL) ?? users[0];
  if (!keepUser) {
    throw new Error("No Sean Manalo user found");
  }

  const keepMember =
    members.find((m) => m.userId === keepUser.id) ??
    members.find(
      (m) =>
        m.registrationContactEmail?.toLowerCase() === CANONICAL_EMAIL ||
        m.name === CANONICAL_NAME,
    ) ??
    members[0];
  if (!keepMember) {
    throw new Error("No Sean Manalo club member found");
  }

  for (const extra of users) {
    if (extra.id === keepUser.id) continue;
    throw new Error(
      `Duplicate Sean Manalo user ${extra.id} <${extra.email}> — remove manually before continuing`,
    );
  }

  for (const extra of members) {
    if (extra.id === keepMember.id) continue;
    if (extra.userId) {
      throw new Error(
        `Duplicate Sean Manalo club member ${extra.id} linked to user ${extra.userId} — remove manually`,
      );
    }
    await prisma.clubMember.delete({ where: { id: extra.id } });
    console.log("Deleted unlinked duplicate club member", extra.id);
  }

  const updated = await prisma.clubMember.update({
    where: { id: keepMember.id },
    data: {
      name: CANONICAL_NAME,
      userId: keepUser.id,
      trainingTeamKey: TEAM_KEY,
      active: true,
      rosterRole: "PLAYER",
      registrationContactEmail:
        keepMember.registrationContactEmail?.toLowerCase() === CANONICAL_EMAIL
          ? keepMember.registrationContactEmail
          : CANONICAL_EMAIL,
    },
  });

  if (keepUser.name !== CANONICAL_NAME || keepUser.email !== CANONICAL_EMAIL) {
    await prisma.user.update({
      where: { id: keepUser.id },
      data: {
        name: CANONICAL_NAME,
        email: CANONICAL_EMAIL,
      },
    });
  }

  console.log("Ensured:", {
    userId: keepUser.id,
    clubMemberId: updated.id,
    trainingTeamKey: updated.trainingTeamKey,
    email: CANONICAL_EMAIL,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
