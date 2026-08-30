/**
 * Rebuild calendar Event rows from TrainingSession start/end times.
 * Run after fixing club timezone handling so existing events get correct UTC instants.
 *
 * Usage (production):
 *   DATABASE_URL=file:/data/jackals.db npx tsx scripts/resync-training-events.ts
 */
import "dotenv/config";
import { syncAllTrainingSessionEvents } from "../src/lib/training-events";

async function main() {
  console.log("Resyncing training session events...");
  await syncAllTrainingSessionEvents();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
