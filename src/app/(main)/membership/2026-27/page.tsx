import { Membership202627Showcase } from "@/components/membership/Membership202627Showcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 Membership",
  description:
    "Jackals VC 2026/27 season membership — kit, fees by team, training nights, and what's included. Division 2 Men, Division 3 Women, and Regional Men.",
  path: "/membership/2026-27",
});

export default function Membership202627Page() {
  return <Membership202627Showcase />;
}
