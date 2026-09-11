/**
 * Idempotent bootstrap for 2026/27 squad player logins.
 *
 * Creates User (role MEMBER) + ClubMember (rosterRole PLAYER) linked together.
 * Emails matched from production KitOrder / trials data against JVC-Squads-26-27.xlsx.
 *
 * Usage (production only):
 *   ALLOW_PRODUCTION_SQUAD_SEED=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/create-production-squad-players.ts
 *
 * Optional:
 *   FORCE_RESET_PLAYER_PASSWORDS=1 — regenerate temporary passwords for existing accounts
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

type SquadKey = "DIV2_MENS" | "DIV3_WOMENS" | "DIVISION_3_MENS";

type PlayerSeed = {
  /** Display name on the account / roster */
  name: string;
  email: string;
  trainingTeamKey: SquadKey;
  /** Short label from the squad sheet (for reporting) */
  squadLabel: string;
};

/**
 * Matched from Desktop JVC-Squads-26-27.xlsx (union of team tabs + All Players)
 * against production KitOrder / TrialsApplication / TrialSessionSignup emails.
 * Typos in kit emails (gnail.com / gmail.con) corrected where trials confirm.
 */
const players: PlayerSeed[] = [
  // D2 Men
  {
    name: "Elijel De La Cruz",
    email: "elijel.delacruz@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Elijel",
  },
  {
    name: "Rodrigo Weber",
    email: "rodrigows09@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Rodrigo",
  },
  {
    name: "Aleksi Akhaladze",
    email: "alexakhaladze65@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Aleksi",
  },
  {
    name: "Damián García",
    email: "da_mian@live.com.mx",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Damian",
  },
  {
    name: "Ronan Casas",
    email: "ronancasas@yahoo.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Ronan",
  },
  {
    name: "Uuganbayar Bayarkhuu",
    email: "uuganbayar0727@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Uuga",
  },
  {
    name: "Sean Thompson",
    email: "seanthompson45@ymail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Sean T",
  },
  {
    name: "Vedant Kote",
    email: "vedantkote08@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Vedant",
  },
  {
    name: "Nicholas Wang",
    email: "dangnicholas1@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Nick",
  },
  {
    name: "Tomas Borovsky",
    email: "tomas.borovsky7491@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Tomas",
  },
  {
    name: "Harrison Kye",
    email: "kharro2009@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Kye",
  },
  {
    name: "Moustafa Saadon",
    email: "moustafasaadon2004@gmail.com",
    trainingTeamKey: "DIV2_MENS",
    squadLabel: "Moustafa",
  },

  // D3 Women
  {
    name: "Jaye John",
    email: "joicyjohn7@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Jaye",
  },
  {
    name: "Viola Caliguia",
    email: "violacaliguia@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Viola",
  },
  {
    name: "Maris Marzan",
    email: "mtmmarzan19@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Maris",
  },
  {
    name: "Zaïg Morvan",
    email: "zgmor7@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Zaig",
  },
  {
    name: "Daniela Barreto",
    email: "danimariano01@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Daniela",
  },
  {
    name: "Daphne McCraw",
    email: "daphnemccraw@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Daphne",
  },
  {
    name: "Lana Bagayan",
    email: "lanabagayan@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Lana",
  },
  {
    name: "Raima Qureshi",
    email: "rizwannancy@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Raima",
  },
  {
    name: "Giulia Kert",
    email: "giuliakert0@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Gulia",
  },
  {
    name: "Manon Constant",
    email: "manon.csnt@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Manon",
  },
  {
    name: "Susan Okullu",
    email: "osue77514@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Susan",
  },
  {
    name: "Vanessa Marcelo",
    email: "banemarcelo@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Vanessa",
  },
  {
    name: "Arina Grigena",
    email: "grigena21@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Arina",
  },
  {
    name: "Eilish Baybay",
    email: "lauraxeilish@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Eilish",
  },
  {
    name: "Maine Cabar",
    email: "jermainecbr@gmail.com",
    trainingTeamKey: "DIV3_WOMENS",
    squadLabel: "Maine",
  },

  // D3 Men
  {
    name: "Dylan Murphy",
    email: "dylanbrockmar@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Dylan",
  },
  {
    name: "Giacomo Jin",
    email: "olorogio27@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Giacomo",
  },
  {
    name: "Kian Nalaza",
    email: "kiannalaza@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Kian",
  },
  {
    name: "Wondrous Aidan Salvador",
    email: "salvadorwondrous@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Aidan",
  },
  {
    name: "Eliott Gouguet",
    email: "eliottgouguet@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Elliot",
  },
  {
    name: "Jamie Asuncion",
    email: "jamie_asuncion@icloud.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "James",
  },
  {
    name: "Nikita Kazakov",
    email: "kazakovn172@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Nikita K.",
  },
  {
    name: "Adewale Adediran",
    email: "adedco123@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Adawale",
  },
  {
    name: "Jack O'Brien",
    email: "jacklovesceltic@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Jack",
  },
  {
    name: "Wenze (Ivan) Li",
    email: "ivan.li6475@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Ivan",
  },
  {
    name: "Sean Manalo",
    email: "smanalo595@gmail.com",
    trainingTeamKey: "DIVISION_3_MENS",
    squadLabel: "Sean M",
  },
];

/** Still need emails from admin before we can create accounts. */
export const missingEmails = [] as const;

function tempPassword() {
  return randomBytes(12).toString("base64url");
}

async function upsertPlayer(
  seed: PlayerSeed,
  options: { forceResetPassword: boolean },
) {
  const email = seed.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  const shouldIssuePassword = !existingUser || options.forceResetPassword;
  const password = shouldIssuePassword ? tempPassword() : null;
  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : existingUser!.passwordHash;

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: seed.name,
      role: existingUser?.role === "ADMIN" ? "ADMIN" : "MEMBER",
      ...(password ? { passwordHash } : {}),
    },
    create: {
      name: seed.name,
      email,
      role: "MEMBER",
      passwordHash,
    },
  });

  const byUser = await prisma.clubMember.findFirst({
    where: { userId: user.id },
  });

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
          ...(byUser.rosterRole === "COACH"
            ? {}
            : { playerPaymentType: "PAYG" }),
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
    squadLabel: seed.squadLabel,
    name: seed.name,
    email,
    trainingTeamKey: seed.trainingTeamKey,
    password,
    createdUser: !existingUser,
    passwordReset: Boolean(existingUser && password),
    clubMemberId: clubMember.id,
    keptCoachRole: byUser?.rosterRole === "COACH",
  };
}

async function main() {
  const allow = process.env.ALLOW_PRODUCTION_SQUAD_SEED === "1";
  const forceResetPassword =
    process.env.FORCE_RESET_PLAYER_PASSWORDS === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost") ||
      process.env.NODE_ENV === "development");

  if (!allow || looksLocal) {
    throw new Error(
      "Refusing to seed real player emails. For production only:\n" +
        "  ALLOW_PRODUCTION_SQUAD_SEED=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/create-production-squad-players.ts",
    );
  }

  const emails = players.map((p) => p.email.trim().toLowerCase());
  const dupes = emails.filter((e, i) => emails.indexOf(e) !== i);
  if (dupes.length > 0) {
    throw new Error(`Duplicate emails in seed list: ${[...new Set(dupes)].join(", ")}`);
  }

  const results = [];
  for (const seed of players) {
    results.push(await upsertPlayer(seed, { forceResetPassword }));
  }

  console.log("Production squad players ready:\n");
  for (const row of results) {
    console.log(`- [${row.trainingTeamKey}] ${row.squadLabel} → ${row.name} <${row.email}>`);
    if (row.keptCoachRole) {
      console.log("  Note: existing COACH roster role preserved");
    }
    if (row.password) {
      console.log(
        `  Temporary password: ${row.password}${
          row.passwordReset ? " (reset)" : " (new account)"
        }`,
      );
    } else {
      console.log("  Temporary password: (unchanged — user already existed)");
    }
    console.log("");
  }

  console.log("Still missing emails (not created):");
  for (const m of missingEmails) {
    console.log(`- ${m.squadLabel} (${m.team}): ${m.note}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
