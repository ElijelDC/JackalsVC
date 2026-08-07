import "server-only";

import { CONTACT_EMAIL } from "@/lib/contact";
import { requireMailTransporter } from "@/lib/email";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";

export type OfferNotifyDetail = { label: string; value: string };

type SendOfferDecisionEmailInput = {
  kind: "Club" | "Coach";
  decision: "accepted" | "declined";
  teamLabel: string;
  fullName: string;
  email: string;
  textLines: string[];
  details: OfferNotifyDetail[];
  adminPath: string;
  recordId?: string;
  footnote?: string;
  replyAudienceLabel: string;
};

/** Contact inbox + admin notify for club/coach offer decisions. */
export async function sendOfferDecisionEmail(input: SendOfferDecisionEmailInput) {
  const { transporter, from } = requireMailTransporter();
  const subject = `[Jackals VC] ${input.kind} offer ${input.decision} — ${input.teamLabel} — ${input.fullName}`;
  const text = input.textLines.join("\n");

  await transporter.sendMail({
    from,
    to: CONTACT_EMAIL,
    replyTo: input.email,
    subject,
    text,
    html: text.replace(/\n/g, "<br>"),
  });

  await notifyAdmins({
    subject,
    replyTo: input.email,
    content: {
      heading: `${input.kind} offer ${input.decision}`,
      paragraphs: [
        `${input.fullName} ${input.decision} a ${input.kind} Offer for ${input.teamLabel} on jackalsvolleyball.com.`,
      ],
      details: input.details,
      ctaUrl: input.recordId
        ? emailSiteUrl(input.adminPath)
        : `mailto:${input.email}`,
      ctaLabel: input.recordId
        ? "View in admin"
        : `Reply to ${input.replyAudienceLabel}`,
      footnote: input.footnote,
    },
  });
}

/** Run notify after a successful DB save; never fail the request on email errors. */
export async function afterSaveNotify(
  label: string,
  notify: () => Promise<unknown>,
) {
  try {
    await notify();
  } catch (error) {
    console.error(`[${label}] email failed after save`, error);
  }
}
