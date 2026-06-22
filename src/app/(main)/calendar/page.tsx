import { redirect } from "next/navigation";

export default function CalendarRedirect() {
  redirect("/events?view=calendar");
}
