import { prisma } from "@/lib/prisma";
import { SquadsManager } from "@/components/admin/SquadsManager";

export const metadata = {
  title: "Admin · Squads",
};

export default async function AdminSquadsPage() {
  const squads = await prisma.trainingSquad.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <SquadsManager initialSquads={squads} />;
}
