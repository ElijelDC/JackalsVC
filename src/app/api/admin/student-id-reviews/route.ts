import { jsonError, jsonServerError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const reviews = await prisma.membership.findMany({
      where: {
        studentIdReviewStatus: "PENDING",
        studentIdProofUrl: { startsWith: "/" },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
      },
      orderBy: { studentIdProofSubmittedAt: "asc" },
    });

    return NextResponse.json({
      reviews: reviews.map((row) => ({
        id: row.id,
        planName: row.plan.name,
        studentIdProofUrl: row.studentIdProofUrl!,
        studentIdProofSubmittedAt:
          row.studentIdProofSubmittedAt?.toISOString() ?? null,
        studentIdReviewStatus: row.studentIdReviewStatus,
        user: row.user,
      })),
    });
  } catch (error) {
    return jsonServerError("Could not load student ID reviews", {
      cause: error,
      route: "GET /api/admin/student-id-reviews",
    });
  }
}
