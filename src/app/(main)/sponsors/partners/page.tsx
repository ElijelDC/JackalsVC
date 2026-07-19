import { redirect } from "next/navigation";

/** Partners listing is paused until we have sponsors — send people to packages. */
export default function OurSponsorsRoute() {
  redirect("/sponsors");
}
