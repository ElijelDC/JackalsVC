/**
 * Seed membership credits for members who overpaid merch / fun sessions,
 * then apply any credit against their next unpaid (PENDING) instalment(s).
 *
 * Self-contained (no src/lib imports) so it can run in the production image.
 *
 * Usage (production):
 *   ALLOW_PRODUCTION_MEMBERSHIP_CREDITS=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/apply-membership-credits.ts
 *
 * Dry run:
 *   DRY_RUN=1 npx tsx scripts/apply-membership-credits.ts
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const CREDIT_NOTE = "merch / fun session overpayment";
const CREDIT_NOTE_SUFFIX = "credit (merch/fun session overpayment)";

const CREDITS: Array<{ nameHint: string; email: string; creditEur: number }> = [
  { nameHint: "Viola Caliguia", email: "violacaliguia@gmail.com", creditEur: 10 },
  { nameHint: "Eilish Baybay", email: "lauraxeilish@gmail.com", creditEur: 35 },
  { nameHint: "Adewale Adediran", email: "adedco123@gmail.com", creditEur: 10 },
  { nameHint: "Leo Magalhaes", email: "itsleo852@gmail.com", creditEur: 25 },
  { nameHint: "Jamie Asuncion", email: "jamie_asuncion@icloud.com", creditEur: 10 },
  { nameHint: "Kirill Prymak", email: "prymak.kirill@gmail.com", creditEur: 25 },
];

function roundEur(value: number): number {
  return Math.round(value * 100) / 100;
}

function withCreditNote(description: string, appliedEur: number): string {
  if (appliedEur <= 0) return description;
  if (description.includes(CREDIT_NOTE_SUFFIX)) return description;
  const label =
    appliedEur % 1 === 0 ? appliedEur.toFixed(0) : appliedEur.toFixed(2);
  return `${description} · €${label} ${CREDIT_NOTE_SUFFIX}`;
}

async function applyCredit(userId: string, creditEur: number) {
  let remaining = roundEur(creditEur);
  if (remaining <= 0) return { appliedEur: 0, remainingCreditEur: 0 };

  const pending = await prisma.payment.findMany({
    where: {
      userId,
      membershipId: { not: null },
      status: "PENDING",
    },
    orderBy: [
      { dueDate: "asc" },
      { installmentNumber: "asc" },
      { createdAt: "asc" },
    ],
    select: { id: true, amount: true, description: true },
  });

  if (pending.length === 0) {
    return { appliedEur: 0, remainingCreditEur: remaining };
  }

  const now = new Date();
  let appliedEur = 0;

  for (const payment of pending) {
    if (remaining <= 0) break;
    const current = roundEur(payment.amount);
    if (current <= 0) continue;
    const reducedBy = Math.min(current, remaining);
    const nextAmount = roundEur(current - reducedBy);
    remaining = roundEur(remaining - reducedBy);
    appliedEur = roundEur(appliedEur + reducedBy);

    if (nextAmount <= 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: 0,
          status: "COMPLETED",
          paidAt: now,
          description: withCreditNote(payment.description, reducedBy),
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: nextAmount,
          description: withCreditNote(payment.description, reducedBy),
        },
      });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { membershipCreditEur: Math.max(0, remaining) },
  });

  return { appliedEur, remainingCreditEur: Math.max(0, remaining) };
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const allow = process.env.ALLOW_PRODUCTION_MEMBERSHIP_CREDITS === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost"));

  if (!dryRun && (!allow || looksLocal)) {
    throw new Error(
      "Refusing to write membership credits. Use DRY_RUN=1 to preview, or production:\n" +
        "  ALLOW_PRODUCTION_MEMBERSHIP_CREDITS=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/apply-membership-credits.ts",
    );
  }

  console.log(dryRun ? "Dry run — no writes.\n" : "Applying membership credits…\n");

  for (const entry of CREDITS) {
    const user = await prisma.user.findUnique({
      where: { email: entry.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        membershipCreditEur: true,
        payments: {
          where: { membershipId: { not: null } },
          orderBy: [{ installmentNumber: "asc" }, { dueDate: "asc" }],
          select: {
            installmentNumber: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      console.log(`✗ ${entry.nameHint} <${entry.email}> — USER NOT FOUND`);
      continue;
    }

    console.log(`→ ${user.name} <${user.email}>`);
    console.log(`  current credit: €${user.membershipCreditEur}`);
    for (const payment of user.payments) {
      console.log(
        `  #${payment.installmentNumber ?? "-"} €${payment.amount} ${payment.status}`,
      );
    }

    if (dryRun) {
      console.log(`  would set credit €${entry.creditEur} (${CREDIT_NOTE})\n`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipCreditEur: entry.creditEur,
        membershipCreditNote: CREDIT_NOTE,
      },
    });

    const result = await applyCredit(user.id, entry.creditEur);
    console.log(
      `  set €${entry.creditEur}; applied €${result.appliedEur}; remaining €${result.remainingCreditEur}\n`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
