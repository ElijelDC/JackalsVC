import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isValidVlyNumberFormat, normalizeVlyNumber } from "@/lib/vly-number";
import { clubMemberCreateSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const clubMembers = await prisma.clubMember.findMany({
    include: {
      user: { select: { id: true, email: true } },
    },
    orderBy: { vlyNumber: "asc" },
  });

  return NextResponse.json({ clubMembers });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    clubMemberCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);
  if (!isValidVlyNumberFormat(vlyNumber)) {
    return jsonError("Enter a valid VLY number (e.g. VLY12345)", 400);
  }

  const existing = await prisma.clubMember.findUnique({ where: { vlyNumber } });
  if (existing) {
    return jsonError("This VLY number is already on the roster", 409);
  }

  const clubMember = await prisma.clubMember.create({
    data: {
      vlyNumber,
      name: data.name.trim(),
      active: data.active ?? true,
    },
  });

  return NextResponse.json({ clubMember }, { status: 201 });
}
