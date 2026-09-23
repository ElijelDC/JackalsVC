/**
 * One-off production member login (player account + D2M/D3W/D3M roster link).
 *
 *   ALLOW_PRODUCTION_SQUAD_SEED=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   PROVISION_NAME="Kirill Example" \
 *   PROVISION_EMAIL="kirill@example.com" \
 *   PROVISION_SQUAD=DIV2_MENS \
 *   npx tsx scripts/provision-member-login.ts
 *
 * Optional: FORCE_RESET_PLAYER_PASSWORDS=1
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  provisionMemberLogin,
  type SquadKey,
} from "./lib/provision-member-login";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const SQUADS: SquadKey[] = [
  "DIV2_MENS",
  "DIV3_WOMENS",
  "DIVISION_3_MENS",
  "DIV4_MENS",
];

async function main() {
  const name = process.env.PROVISION_NAME?.trim();
  const email = process.env.PROVISION_EMAIL?.trim().toLowerCase();
  const squad = (process.env.PROVISION_SQUAD?.trim() ||
    "DIV2_MENS") as SquadKey;

  if (!name || !email) {
    throw new Error("Set PROVISION_NAME and PROVISION_EMAIL");
  }
  if (!SQUADS.includes(squad)) {
    throw new Error(`Invalid PROVISION_SQUAD. Use one of: ${SQUADS.join(", ")}`);
  }

  const result = await provisionMemberLogin(
    prisma,
    dbUrl,
    { name, email, trainingTeamKey: squad, squadLabel: name.split(/\s+/)[0] },
    { forceResetPassword: process.env.FORCE_RESET_PLAYER_PASSWORDS === "1" },
  );

  console.log("Member login provisioned:\n");
  console.log(`  Name:  ${result.name}`);
  console.log(`  Email: ${result.email}`);
  console.log(`  Squad: ${result.trainingTeamKey}`);
  console.log(`  Club member id: ${result.clubMemberId}`);
  if (result.linkedExistingRoster) {
    console.log("  Linked to existing roster row (no duplicate member).");
  }
  if (result.keptCoachRole) {
    console.log("  Note: COACH roster role preserved.");
  }
  if (result.password) {
    console.log(
      `\n  Temporary password: ${result.password}${
        result.passwordReset ? " (reset)" : " (new account)"
      }`,
    );
    console.log("  User must change password on first sign-in.");
  } else {
    console.log("\n  Temporary password: (unchanged — account already existed)");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
