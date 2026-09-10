import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  listSquadCoaches,
  notifyCoverCoachesAfterHeadDecline,
} from "../src/lib/coach-session-coverage";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" }),
});

async function main() {
  const coaches = await listSquadCoaches("DIV3_WOMENS");
  console.log("DIV3 coaches:", coaches);

  const head = coaches.find((c) => c.isHeadCoach);
  if (!head) {
    throw new Error("No head coach for DIV3_WOMENS");
  }

  const event = await prisma.event.findFirst({
    where: { title: { contains: "Coach cover demo" } },
  });
  if (!event) throw new Error("Demo event missing");

  console.log("Notifying cover coaches for event", event.id, "head", head.email);
  const result = await notifyCoverCoachesAfterHeadDecline({
    eventId: event.id,
    headUserId: head.userId,
    trainingTeamKey: "DIV3_WOMENS",
  });
  console.log("notify result:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
