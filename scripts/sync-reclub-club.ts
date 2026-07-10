import "dotenv/config";
import { syncReclubClubUpcomingActivities } from "../src/lib/reclub-sync";

async function main() {
  const result = await syncReclubClubUpcomingActivities({ notifyMembers: false });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
