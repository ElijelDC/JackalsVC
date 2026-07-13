import { requireMailTransporter } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/contact";
import {
  coachingCommuteLabel,
  coachingQualificationLabel,
} from "@/lib/coaching-recruitment-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import type { z } from "zod";
import type { coachingApplicationSchema } from "@/lib/validations";

type CoachingApplicationData = z.infer<typeof coachingApplicationSchema>;

function formatApplicationText(data: CoachingApplicationData) {
  return [
    `Full name: ${data.fullName}`,
    `Age: ${data.age}`,
    `Contact number: ${data.contactNumber}`,
    `Contact email: ${data.contactEmail}`,
    `VLY Ireland coach level: ${coachingQualificationLabel(data.qualificationLevel)}`,
    `Years of experience: ${data.yearsExperience}`,
    `Commute to Luttrellstown & Meakstown: ${coachingCommuteLabel(data.canCommuteToBothVenues)}`,
    "",
    "Why interested in coaching for Jackals:",
    data.whyInterested,
  ].join("\n");
}

export async function sendCoachingApplicationEmail(
  data: CoachingApplicationData,
  applicationId?: string,
) {
  const { transporter, from } = requireMailTransporter();
  const subject = `[Jackals VC] Coaching application — ${data.fullName}`;

  await transporter.sendMail({
    from,
    to: CONTACT_EMAIL,
    replyTo: data.contactEmail,
    subject,
    text: formatApplicationText(data),
    html: formatApplicationText(data).replace(/\n/g, "<br>"),
  });

  await notifyAdmins({
    subject,
    replyTo: data.contactEmail,
    content: {
      heading: "New coaching application",
      paragraphs: [
        `${data.fullName} submitted a coaching application on jackalsvolleyball.com.`,
      ],
      details: [
        { label: "Name", value: data.fullName },
        { label: "Age", value: String(data.age) },
        { label: "Phone", value: data.contactNumber },
        { label: "Email", value: data.contactEmail },
        {
          label: "VLY Ireland coach level",
          value: coachingQualificationLabel(data.qualificationLevel),
        },
        { label: "Experience", value: `${data.yearsExperience} years` },
        {
          label: "Commute",
          value: coachingCommuteLabel(data.canCommuteToBothVenues),
        },
      ],
      ctaUrl: applicationId
        ? emailSiteUrl("/admin/coaching-applications")
        : `mailto:${data.contactEmail}`,
      ctaLabel: applicationId ? "View in admin" : "Reply to applicant",
      footnote: data.whyInterested,
    },
  });
}
