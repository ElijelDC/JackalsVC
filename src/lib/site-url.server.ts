import "server-only";

import { headers } from "next/headers";
import { getSiteUrlFromHeaders } from "@/lib/site-url";

export async function getSiteUrl() {
  const headersList = await headers();
  return getSiteUrlFromHeaders(headersList);
}
