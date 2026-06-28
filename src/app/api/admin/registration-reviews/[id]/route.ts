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
  try {
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
      return jsonError(
        "This registration was not found. Refresh the page — it may have already been reviewed.",
        404,
      );
    }

    if (member.userId) {
      return jsonError(
        "This member already has an account, so their registration no longer needs review.",
        409,
      );
    }

    if (member.registrationReviewStatus !== "PENDING") {
      return jsonError(
        "This registration is no longer waiting for review. Refresh the page to see the latest status.",
        409,
      );
    }

    if (!member.vlyMembershipPhotoUrl) {
      return jsonError(
        "No VLY membership photo was submitted for this registration.",
        400,
      );
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

    let emailWarning: string | null = null;

    if (member.registrationContactEmail) {
      const emailResult =
        data.action === "approve"
          ? await sendNotificationEmail({
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
            })
          : await sendNotificationEmail({
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

      if (!emailResult.delivered) {
        emailWarning =
          data.action === "approve"
            ? `${member.name} was approved, but the approval email could not be sent. Ask them to enter their VLY number again to continue registration, and check SMTP settings if this keeps happening.`
            : `${member.name} was declined, but the notification email could not be sent. Ask them to re-enter their VLY number and upload a clearer photo, and check SMTP settings if this keeps happening.`;
      }
    } else {
      emailWarning =
        data.action === "approve"
          ? `${member.name} was approved, but no contact email was saved for this registration. Ask them to enter their VLY number again to continue.`
          : `${member.name} was declined. No contact email was saved, so they were not notified automatically.`;
    }

    return NextResponse.json({
      review: {
        ...updated,
        registrationReviewedAt:
          updated.registrationReviewedAt?.toISOString() ?? null,
      },
      emailWarning,
    });
  } catch (error) {
    console.error("[registration-reviews] PATCH failed", error);
    return jsonError(
      "We couldn't save this registration review. Refresh the page and try again. If the problem continues, check the server logs or SMTP settings.",
      500,
    );
  }
}
