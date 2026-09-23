import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

export type SquadKey = "DIV2_MENS" | "DIV3_WOMENS" | "DIVISION_3_MENS" | "DIV4_MENS";

export type MemberLoginSeed = {
  name: string;
  email: string;
  trainingTeamKey: SquadKey;
  squadLabel?: string;
};

function tempPassword() {
  return randomBytes(12).toString("base64url");
}

function assertProductionDb(dbUrl: string) {
  const allow = process.env.ALLOW_PRODUCTION_SQUAD_SEED === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost") ||
      process.env.NODE_ENV === "development");

  if (!allow || looksLocal) {
    throw new Error(
      "Refusing to provision member logins outside production.\n" +
        "  ALLOW_PRODUCTION_SQUAD_SEED=1 DATABASE_URL=file:/data/jackals.db …",
    );
  }
}

export async function provisionMemberLogin(
  prisma: PrismaClient,
  dbUrl: string,
  seed: MemberLoginSeed,
  options: { forceResetPassword?: boolean } = {},
) {
  assertProductionDb(dbUrl);

  const email = seed.email.trim().toLowerCase();
  const forceResetPassword = options.forceResetPassword ?? false;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const shouldIssuePassword = !existingUser || forceResetPassword;
  const password = shouldIssuePassword ? tempPassword() : null;
  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : existingUser!.passwordHash;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: seed.name,
      role: existingUser?.role === "ADMIN" ? "ADMIN" : "MEMBER",
      ...(password ? { passwordHash, mustChangePassword: true } : {}),
    },
    create: {
      name: seed.name,
      email,
      role: "MEMBER",
      passwordHash,
      mustChangePassword: true,
    },
  });

  let byUser = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

  if (!byUser) {
    byUser = await prisma.clubMember.findFirst({
      where: {
        userId: null,
        trainingTeamKey: seed.trainingTeamKey,
        name: { contains: seed.name.split(/\s+/)[0] },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!byUser) {
    byUser = await prisma.clubMember.findFirst({
      where: { registrationContactEmail: email },
    });
  }

  const clubMember = byUser
    ? await prisma.clubMember.update({
        where: { id: byUser.id },
        data: {
          name: seed.name,
          active: true,
          rosterRole: byUser.rosterRole === "COACH" ? "COACH" : "PLAYER",
          trainingTeamKey: seed.trainingTeamKey,
          userId: user.id,
          registrationContactEmail: email,
          ...(byUser.rosterRole === "COACH" ? {} : { playerPaymentType: "PAYG" }),
        },
      })
    : await prisma.clubMember.create({
        data: {
          vlyNumber: null,
          name: seed.name,
          active: true,
          rosterRole: "PLAYER",
          playerPaymentType: "PAYG",
          trainingTeamKey: seed.trainingTeamKey,
          userId: user.id,
          registrationContactEmail: email,
          playerNumber: null,
        },
      });

  return {
    name: seed.name,
    email,
    trainingTeamKey: seed.trainingTeamKey,
    password,
    createdUser: !existingUser,
    passwordReset: Boolean(existingUser && password),
    clubMemberId: clubMember.id,
    linkedExistingRoster: Boolean(byUser && byUser.userId !== user.id),
    keptCoachRole: byUser?.rosterRole === "COACH",
  };
}
