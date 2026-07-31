import type { TrialsApplicationRecord } from "@/lib/trials-application-config";
import {
  TRIALS_TEAM_OPTIONS,
  trialsInlDivisionLabel,
  trialsPositionLabel,
  trialsTeamLabel,
  type TrialsTeamOption,
} from "@/lib/trials-recruitment-config";

type SiteContentMap = Record<string, string>;

function resolveSiteContent(map: SiteContentMap, key: string, fallback: string) {
  const value = map[key]?.trim();
  return value || fallback;
}

export type TrialsEmailTemplate = {
  subject: string;
  body: string;
};

export type TrialsEmailTemplateMap = Record<TrialsTeamOption, TrialsEmailTemplate>;

const TRIALS_CONFIRMATION_FOOTNOTE =
  "Jackals Volleyball Club — main trainings at Meakstown Community Centre; extra training and matchdays at Luttrellstown Community Centre.";

export const TRIALS_EMAIL_MERGE_FIELDS = [
  { token: "{{firstName}}", label: "First name" },
  { token: "{{fullName}}", label: "Full name" },
  { token: "{{team}}", label: "Tryout team" },
  { token: "{{email}}", label: "Email" },
  { token: "{{phone}}", label: "Phone" },
  { token: "{{age}}", label: "Age" },
  { token: "{{position1}}", label: "Position 1" },
  { token: "{{position2}}", label: "Position 2" },
] as const;

function templateKey(team: TrialsTeamOption, field: "subject" | "body") {
  return `trials.email.${team}.${field}`;
}

export function firstNameFrom(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

function defaultTemplate(team: TrialsTeamOption): TrialsEmailTemplate {
  const teamLabel = trialsTeamLabel(team);

  return {
    subject: `Jackals VC — ${teamLabel} trials update`,
    body: [
      `Thanks again for signing up for the Jackals VC ${teamLabel} trials.`,
      "",
      "Trial details:",
      "[Paste trial link or date/time/location here]",
      "",
      "Squad group chat:",
      "[Paste WhatsApp or group chat link here]",
      "",
      "See you on court.",
    ].join("\n"),
  };
}

export function getDefaultTrialsEmailTemplates(): TrialsEmailTemplateMap {
  return Object.fromEntries(
    TRIALS_TEAM_OPTIONS.map((option) => [
      option.value,
      defaultTemplate(option.value),
    ]),
  ) as TrialsEmailTemplateMap;
}

export function loadTrialsEmailTemplates(
  map: SiteContentMap,
): TrialsEmailTemplateMap {
  const defaults = getDefaultTrialsEmailTemplates();

  return Object.fromEntries(
    TRIALS_TEAM_OPTIONS.map((option) => {
      const team = option.value;
      const fallback = defaults[team];
      return [
        team,
        {
          subject: resolveSiteContent(
            map,
            templateKey(team, "subject"),
            fallback.subject,
          ),
          body: resolveSiteContent(map, templateKey(team, "body"), fallback.body),
        },
      ];
    }),
  ) as TrialsEmailTemplateMap;
}

export function buildTrialsEmailTemplateKeys(
  team: TrialsTeamOption,
  template: TrialsEmailTemplate,
) {
  return [
    { key: templateKey(team, "subject"), value: template.subject },
    { key: templateKey(team, "body"), value: template.body },
  ];
}

export function buildTrialsEmailMergeContext(
  application: Pick<
    TrialsApplicationRecord,
    | "fullName"
    | "contactEmail"
    | "contactNumber"
    | "age"
    | "tryingOutFor"
    | "preferredPosition1"
    | "preferredPosition2"
    | "inlDivision"
    | "inlDivisionOther"
    | "inlTeamName"
    | "yearsExperience"
  >,
) {
  const inlDivision = trialsInlDivisionLabel(application.inlDivision);
  const inlDivisionLabel = application.inlDivisionOther
    ? `${inlDivision} — ${application.inlDivisionOther}`
    : inlDivision;

  return {
    firstName: firstNameFrom(application.fullName),
    fullName: application.fullName.trim(),
    team: trialsTeamLabel(application.tryingOutFor),
    email: application.contactEmail,
    phone: application.contactNumber,
    age: String(application.age),
    position1: trialsPositionLabel(application.preferredPosition1),
    position2: trialsPositionLabel(application.preferredPosition2),
    yearsExperience: String(application.yearsExperience),
    inlDivision: inlDivisionLabel,
    inlTeamName: application.inlTeamName ?? "",
  };
}

export function mergeTrialsEmailTemplate(
  template: string,
  application: Pick<
    TrialsApplicationRecord,
    | "fullName"
    | "contactEmail"
    | "contactNumber"
    | "age"
    | "tryingOutFor"
    | "preferredPosition1"
    | "preferredPosition2"
    | "inlDivision"
    | "inlDivisionOther"
    | "inlTeamName"
    | "yearsExperience"
  >,
) {
  const context = buildTrialsEmailMergeContext(application);

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in context) {
      return context[key as keyof typeof context];
    }
    return match;
  });
}

export function bodyToEmailParagraphs(body: string) {
  const chunks = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (chunks.length > 0) return chunks;

  const trimmed = body.trim();
  return trimmed ? [trimmed] : [];
}

export function trialsApplicantEmailFootnote() {
  return TRIALS_CONFIRMATION_FOOTNOTE;
}

export function isTrialsTeamOption(value: string): value is TrialsTeamOption {
  return TRIALS_TEAM_OPTIONS.some((option) => option.value === value);
}
