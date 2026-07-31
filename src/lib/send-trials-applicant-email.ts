import { sendNotificationEmail, type NotificationContent } from "@/lib/notify";
import type { TrialsApplicationRecord } from "@/lib/trials-application-config";
import {
  bodyToEmailParagraphs,
  firstNameFrom,
  mergeTrialsEmailTemplate,
  trialsApplicantEmailFootnote,
  type TrialsEmailTemplate,
} from "@/lib/trials-email-templates";
import { trialsTeamLabel } from "@/lib/trials-recruitment-config";

export async function sendTrialsApplicantEmail(
  application: TrialsApplicationRecord,
  template: TrialsEmailTemplate,
  options?: {
    subjectOverride?: string;
    bodyOverride?: string;
  },
) {
  const subject = mergeTrialsEmailTemplate(
    options?.subjectOverride ?? template.subject,
    application,
  );
  const mergedBody = mergeTrialsEmailTemplate(
    options?.bodyOverride ?? template.body,
    application,
  );

  const content: NotificationContent = {
    heading: `${trialsTeamLabel(application.tryingOutFor)} trials`,
    greeting: `Hi ${firstNameFrom(application.fullName)},`,
    paragraphs: bodyToEmailParagraphs(mergedBody),
    details: [{ label: "Team", value: trialsTeamLabel(application.tryingOutFor) }],
    footnote: trialsApplicantEmailFootnote(),
    linkifyParagraphs: true,
  };

  return sendNotificationEmail({
    to: application.contactEmail,
    subject,
    content,
  });
}
