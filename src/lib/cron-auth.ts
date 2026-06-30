import { auth } from "@/auth";

export async function authorizeCronRequest(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && headerSecret === secret) {
    return true;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}
