/**
 * Backfill Student/U18 memberships that pre-date the student ID upload feature.
 *
 * Sets `studentIdReviewStatus = AWAITING_PROOF` when there is no ID photo, so
 * members (e.g. Davis/David Kols) see the upload card. Does not touch Adult
 * plans or already-APPROVED / DECLINED / PENDING-with-proof rows.
 *
 * Note: member-facing UI already treats null status on Student/U18 as needing
 * upload — this script makes admin “No ID yet” filtering consistent.
 *
 * Dry run (default):
 *   npx tsx scripts/backfill-student-id-awaiting-proof.ts
 *
 * Apply:
 *   APPLY=1 npx tsx scripts/backfill-student-id-awaiting-proof.ts
 *
 * Production on Hetzner (after code is deployed):
 *   ssh root@46.225.120.67
 *   cd /opt/app   # or HETZNER_APP_DIR
 *   docker compose exec app npx tsx scripts/backfill-student-id-awaiting-proof.ts
 *   docker compose exec -e APPLY=1 app npx tsx scripts/backfill-student-id-awaiting-proof.ts
 *
 * SQLite one-liner (host volume, plan name exact):
 *   sqlite3 /data/jackals.db "UPDATE Membership SET studentIdReviewStatus='AWAITING_PROOF' WHERE id IN (SELECT m.id FROM Membership m JOIN MembershipPlan p ON p.id=m.planId WHERE p.name='Student / U18' AND m.endDate > datetime('now') AND (m.studentIdProofUrl IS NULL OR m.studentIdProofUrl='') AND IFNULL(m.studentIdReviewStatus,'') NOT IN ('APPROVED','DECLINED','PENDING'));"
 */
import { MEMBERSHIP_PLAN_STUDENT_NAME } from "../src/lib/membership-config";
import { prisma } from "../src/lib/prisma";
import { backfillStudentIdAwaitingProof } from "../src/lib/student-id-reviews";

const apply = process.env.APPLY === "1";

async function main() {
  console.log(`Database: ${process.env.DATABASE_URL ?? "file:./prisma/dev.db (default)"}`);
  console.log(`Mode: ${apply ? "APPLY" : "dry-run (set APPLY=1 to write)"}`);
  console.log(`Student plan name: ${MEMBERSHIP_PLAN_STUDENT_NAME}`);

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

  const result = await backfillStudentIdAwaitingProof({ dryRun: !apply });

  console.log(`Matched ${result.matched.length} membership(s):`);
  for (const row of result.matched) {
    console.log(
      `  - ${row.name} <${row.email}> ${row.previousStatus ?? "null"} → ${row.nextStatus}`,
    );
  }
  console.log(
    apply
      ? `Updated ${result.updatedCount} membership(s).`
      : "Dry run complete — re-run with APPLY=1 to write.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
