import { Membership202627Showcase } from "@/components/membership/Membership202627Showcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 Membership",
  description:
    "Jackals VC 2026/27 season membership — kit, fees by league, and what's included. National League and Regional League squads.",
  path: "/membership/2026-27",
});

export default function Membership202627Page() {
  return <Membership202627Showcase />;
}
