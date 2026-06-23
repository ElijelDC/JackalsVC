import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, response: jsonError("Unauthorized", 401) };
  }
  return { session, response: null };
}

export async function requireAdmin() {
  const { session, response } = await requireSession();
  if (response) return { session: null, response };
  if (session!.user.role !== "ADMIN") {
    return { session: null, response: jsonError("Forbidden", 403) };
  }
  return { session, response: null };
}

export async function requireClubMember() {
  const { session, response } = await requireSession();
  if (response) {
    return { session: null, clubMember: null, response };
  }

  const clubMember = await prisma.clubMember.findUnique({
    where: { userId: session!.user.id },
  });

  if (!clubMember?.active) {
    return {
      session: null,
      clubMember: null,
      response: jsonError("No active roster entry linked to your account.", 403),
    };
  }

  return { session, clubMember, response: null };
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
  fallbackMessage = "Invalid input",
) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return {
        data: null,
        response: jsonError(
          parsed.error.issues[0]?.message ?? fallbackMessage,
          400,
        ),
      };
    }
    return { data: parsed.data, response: null };
  } catch {
    return { data: null, response: jsonError(fallbackMessage, 400) };
  }
}
