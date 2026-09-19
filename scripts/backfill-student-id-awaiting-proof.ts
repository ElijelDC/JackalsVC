/**
 * Backfill Student/U18 memberships that pre-date the student ID upload feature.
 *
 * Sets `studentIdReviewStatus = AWAITING_PROOF` when there is no ID photo, so
 * members (e.g. Davis/David Kols) see the upload card. Does not touch Adult
 * plans or already-APPROVED / DECLINED / PENDING-with-proof rows.
 *
 * Self-contained for the production Docker image (no @/ imports).
 *
 * Dry run (default):
 *   npx tsx scripts/backfill-student-id-awaiting-proof.ts
 *
 * Apply:
 *   APPLY=1 npx tsx scripts/backfill-student-id-awaiting-proof.ts
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const STUDENT_PLAN_NAME = "Student / U18";
const apply = process.env.APPLY === "1";
const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Database: ${dbUrl}`);
  console.log(`Mode: ${apply ? "APPLY" : "dry-run (set APPLY=1 to write)"}`);

  const kols = await prisma.user.findMany({
    where: {
      OR: [{ name: { contains: "Kols" } }, { email: { contains: "kols" } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: {
        where: { endDate: { gt: new Date() } },
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (kols.length === 0) {
    console.log("No user matching Kols found (ok if local DB has no prod data).");
  } else {
    for (const user of kols) {
      const m = user.memberships[0];
      console.log(
        `Found: ${user.name} <${user.email}> plan=${m?.plan.name ?? "none"} status=${m?.studentIdReviewStatus ?? "null"} proof=${m?.studentIdProofUrl ? "yes" : "no"}`,
      );
    }
  }

  const rows = await prisma.membership.findMany({
    where: {
      endDate: { gt: new Date() },
      plan: { name: STUDENT_PLAN_NAME },
      OR: [
        { studentIdReviewStatus: null },
        {
          studentIdReviewStatus: {
            notIn: ["APPROVED", "DECLINED", "PENDING", "AWAITING_PROOF"],
          },
        },
      ],
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const updates = rows.flatMap((row) => {
    if (row.studentIdReviewStatus === "APPROVED") return [];
    if (row.studentIdReviewStatus === "DECLINED") return [];
    if (
      row.studentIdReviewStatus === "PENDING" &&
      row.studentIdProofUrl?.startsWith("/")
    ) {
      return [];
    }

    const hasProof = Boolean(row.studentIdProofUrl?.startsWith("/"));
    const nextStatus = hasProof ? ("PENDING" as const) : ("AWAITING_PROOF" as const);
    if (row.studentIdReviewStatus === nextStatus) return [];

    return [
      {
        id: row.id,
        name: row.user.name,
        email: row.user.email,
        previousStatus: row.studentIdReviewStatus,
        nextStatus,
      },
    ];
  });

  console.log(`Matched ${updates.length} membership(s):`);
  for (const row of updates) {
    console.log(
      `  - ${row.name} <${row.email}> ${row.previousStatus ?? "null"} → ${row.nextStatus}`,
    );
  }

  if (!apply) {
    console.log("Dry run complete — re-run with APPLY=1 to write.");
    return;
  }

  const awaitingIds = updates
    .filter((row) => row.nextStatus === "AWAITING_PROOF")
    .map((row) => row.id);
  const pendingIds = updates
    .filter((row) => row.nextStatus === "PENDING")
    .map((row) => row.id);

  if (awaitingIds.length > 0) {
    await prisma.membership.updateMany({
      where: { id: { in: awaitingIds } },
      data: {
        studentIdReviewStatus: "AWAITING_PROOF",
        studentIdReviewedAt: null,
        studentIdReviewedByUserId: null,
        studentIdReviewNote: null,
      },
    });
  }
  if (pendingIds.length > 0) {
    await prisma.membership.updateMany({
      where: { id: { in: pendingIds } },
      data: { studentIdReviewStatus: "PENDING" },
    });
  }

  console.log(`Updated ${updates.length} membership(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
