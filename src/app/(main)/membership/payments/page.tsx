import { redirect } from "next/navigation";

export const metadata = {
  title: "Membership",
};

export default function MembershipPaymentsPage() {
  redirect("/membership");
}
