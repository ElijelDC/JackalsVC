import { auth } from "@/auth";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function authorizeCronRequest(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && headerSecret === secret) {
    return true;
  }

  if (isProduction()) {
    return false;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function authorizePrivilegedSyncRequest(
  request: Request,
  headerName: string,
  envSecretName: "PAYMENTS_SYNC_SECRET" | "CRON_SECRET",
): Promise<boolean> {
  const secret = process.env[envSecretName]?.trim();
  const headerSecret = request.headers.get(headerName);

  if (secret && headerSecret === secret) {
    return true;
  }

  if (isProduction()) {
    return false;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}
