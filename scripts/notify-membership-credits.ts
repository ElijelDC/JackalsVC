/**
 * Email members who have a membership credit (pending or already applied)
 * so they know it reduces their upcoming membership payment.
 *
 * Self-contained for the production image.
 *
 * Usage:
 *   ALLOW_PRODUCTION_MEMBERSHIP_CREDIT_EMAILS=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/notify-membership-credits.ts
 *
 * Dry run:
 *   DRY_RUN=1 npx tsx scripts/notify-membership-credits.ts
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import nodemailer from "nodemailer";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const EMAILS = [
  "violacaliguia@gmail.com",
  "lauraxeilish@gmail.com",
  "adedco123@gmail.com",
  "itsleo852@gmail.com",
  "jamie_asuncion@icloud.com",
  "prymak.kirill@gmail.com",
];

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseAppliedCredit(description: string | null | undefined): number | null {
  if (!description) return null;
  const match = description.match(
    /€(\d+(?:\.\d{1,2})?)\s+credit \(merch\/fun session overpayment\)/i,
  );
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function siteUrl(path = ""): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "https://jackalsvolleyball.com"
  ).replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function requireMail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ||
    (user ? `Jackals VC <${user}>` : undefined);
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP is not configured (SMTP_HOST/USER/PASS/FROM).");
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return { transporter, from };
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const allow = process.env.ALLOW_PRODUCTION_MEMBERSHIP_CREDIT_EMAILS === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost"));

  if (!dryRun && (!allow || looksLocal)) {
    throw new Error(
      "Refusing to send. Use DRY_RUN=1, or production:\n" +
        "  ALLOW_PRODUCTION_MEMBERSHIP_CREDIT_EMAILS=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/notify-membership-credits.ts",
    );
  }

  const mail = dryRun ? null : requireMail();
  const membershipUrl = siteUrl("/membership");

  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        name: true,
        email: true,
        membershipCreditEur: true,
        membershipCreditNote: true,
        payments: {
          where: { membershipId: { not: null }, status: "PENDING" },
          orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }],
          take: 1,
          select: { amount: true, description: true, dueDate: true },
        },
      },
    });

    if (!user) {
      console.log(`✗ ${email} — not found`);
      continue;
    }

    const nextPayment = user.payments[0] ?? null;
    const applied = nextPayment
      ? parseAppliedCredit(nextPayment.description)
      : null;
    const pending = user.membershipCreditEur > 0 ? user.membershipCreditEur : 0;
    const creditEur = pending > 0 ? pending : applied ?? 0;

    if (creditEur <= 0) {
      console.log(`· ${user.name} — no credit to notify`);
      continue;
    }

    const firstName = user.name.trim().split(/\s+/)[0] || "there";
    const creditLabel = formatEuro(creditEur);
    const reason =
      user.membershipCreditNote?.trim() || "merch / fun session overpayment";
    const alreadyApplied = pending <= 0 && Boolean(applied);

    const text = alreadyApplied
      ? [
          `Hi ${firstName},`,
          "",
          `You have a ${creditLabel} membership credit (${reason}).`,
          nextPayment
            ? `It has already been applied to your upcoming membership payment — please transfer ${formatEuro(nextPayment.amount)} (the reduced amount), not the original instalment.`
            : "It has already been applied to your upcoming membership payment. Please transfer the reduced amount shown on your membership page.",
          "",
          "View your membership page:",
          membershipUrl,
          "",
          "Thanks,",
          "Jackals VC",
        ].join("\n")
      : [
          `Hi ${firstName},`,
          "",
          `You have a ${creditLabel} membership credit on your Jackals account (${reason}).`,
          "It will come off your upcoming membership payment when you subscribe (or your next unpaid instalment).",
          "",
          "View your membership page:",
          membershipUrl,
          "",
          "Thanks,",
          "Jackals VC",
        ].join("\n");

    console.log(
      `→ ${user.name} <${user.email}> ${creditLabel} (${alreadyApplied ? "applied" : "pending"})`,
    );

    if (dryRun || !mail) continue;

    await mail.transporter.sendMail({
      from: mail.from,
      to: user.email,
      subject: `${creditLabel} membership credit on your Jackals account`,
      text,
      html: text
        .split("\n")
        .map((line) => (line ? `<p>${line}</p>` : "<br/>"))
        .join(""),
    });
    console.log("  emailed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
