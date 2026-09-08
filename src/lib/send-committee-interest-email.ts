import { requireMailTransporter } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/contact";
import { committeeRoleLabel } from "@/lib/committee-roles-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import type { z } from "zod";
import type { committeeInterestSchema } from "@/lib/validations";

type CommitteeInterestData = z.infer<typeof committeeInterestSchema>;

function formatInterestText(data: CommitteeInterestData) {
  return [
    `Full name: ${data.fullName}`,
    `1st choice: ${committeeRoleLabel(data.roleInterest1)}`,
    `2nd choice: ${committeeRoleLabel(data.roleInterest2)}`,
    `3rd choice: ${committeeRoleLabel(data.roleInterest3)}`,
  ].join("\n");
}

export async function sendCommitteeInterestEmail(
  data: CommitteeInterestData,
  interestId?: string,
) {
  const { transporter, from } = requireMailTransporter();
  const subject = `[Jackals VC] Committee interest — ${data.fullName}`;

  await transporter.sendMail({
    from,
    to: CONTACT_EMAIL,
    subject,
    text: formatInterestText(data),
    html: formatInterestText(data).replace(/\n/g, "<br>"),
  });

  await notifyAdmins({
    subject,
    content: {
      heading: "New committee role interest",
      paragraphs: [
        `${data.fullName} shared their top three committee role preferences on jackalsvolleyball.com.`,
      ],
      details: [
        { label: "Name", value: data.fullName },
        { label: "1st choice", value: committeeRoleLabel(data.roleInterest1) },
        { label: "2nd choice", value: committeeRoleLabel(data.roleInterest2) },
        { label: "3rd choice", value: committeeRoleLabel(data.roleInterest3) },
      ],
      ctaUrl: interestId
        ? emailSiteUrl("/admin/committee-interests")
        : emailSiteUrl("/admin"),
      ctaLabel: "View in admin",
    },
  });
}
