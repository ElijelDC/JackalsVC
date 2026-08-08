import { redirect } from "next/navigation";

export default function AdminTrialSessionsRedirectPage() {
  redirect("/admin/one-off-sessions");
}
