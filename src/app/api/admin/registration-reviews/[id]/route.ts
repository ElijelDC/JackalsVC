import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewActionSchema = z.object({
  action: z.enum(["approve", "decline"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    reviewActionSchema,
  );
  if (parseError || !data) return parseError!;

  const member = await prisma.clubMember.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      userId: true,
      registrationReviewStatus: true,
      vlyMembershipPhotoUrl: true,
      registrationContactEmail: true,
    },
  });

  if (!member) {
    return jsonError("Registration review not found.", 404);
  }

  if (member.userId) {
    return jsonError("This member already has an account.", 409);
  }

  if (member.registrationReviewStatus !== "PENDING") {
    return jsonError("This registration is no longer pending review.", 409);
  }

  if (!member.vlyMembershipPhotoUrl) {
    return jsonError("No membership photo was submitted.", 400);
  }

  const updated = await prisma.clubMember.update({
    where: { id },
    data: {
      registrationReviewStatus:
        data.action === "approve" ? "APPROVED" : "DECLINED",
      registrationReviewedAt: new Date(),
      registrationReviewedByUserId: session!.user.id,
    },
    select: {
      id: true,
      registrationReviewStatus: true,
      registrationReviewedAt: true,
    },
  });

  if (member.registrationContactEmail) {
    if (data.action === "approve") {
      await sendNotificationEmail({
        to: member.registrationContactEmail,
        subject: "Your Jackals VC registration is approved",
        content: {
          heading: "You're approved!",
          greeting: `Hi ${member.name},`,
          paragraphs: [
            "An admin has approved your VLY membership photo. You can now finish creating your Jackals VC account.",
            "Open the registration window, enter your VLY number again, and you'll continue straight to the email and password steps.",
          ],
          ctaUrl: emailSiteUrl("/?auth=register"),
          ctaLabel: "Finish registration",
        },
      });
    } else {
      await sendNotificationEmail({
        to: member.registrationContactEmail,
        subject: "Your Jackals VC registration photo needs another look",
        content: {
          heading: "Registration photo declined",
          greeting: `Hi ${member.name},`,
          paragraphs: [
            "An admin couldn't approve the VLY membership photo you submitted. This usually means the photo was unclear or didn't match your VLY number.",
            "Please re-enter your VLY number in the registration window and upload a clearer photo of your VLY membership card.",
          ],
          ctaUrl: emailSiteUrl("/?auth=register"),
          ctaLabel: "Re-upload photo",
        },
      });
    }
  }

  return NextResponse.json({
    review: {
      ...updated,
      registrationReviewedAt:
        updated.registrationReviewedAt?.toISOString() ?? null,
    },
  });
}
