import { MembershipFees202627Showcase } from "@/components/membership/MembershipFees202627Showcase";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "2026/27 Membership Fees",
  description:
    "Jackals VC 2026/27 season membership fees — what you pay, what's included, and where your money goes. National League and Regional League pricing.",
  path: "/membership/fees-2026-27",
});

export default function MembershipFees202627Page() {
  return <MembershipFees202627Showcase />;
}
