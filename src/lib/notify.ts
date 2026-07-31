import { CONTACT_EMAIL } from "@/lib/contact";
import { getMailFromAddress, getMailTransporter } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { resolveSiteUrl } from "@/lib/site-config";

const BRAND_RED = "#e8222a";

function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const email = raw.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }
  return result;
}

/**
 * Resolves the set of email addresses that should receive admin notifications.
 *
 * Priority:
 *   1. `ADMIN_NOTIFICATION_EMAILS` env (comma-separated) if set
 *   2. Email addresses of all users with role ADMIN
 *   3. Fallback to the public club contact address
 */
export async function getAdminNotificationEmails(): Promise<string[]> {
  const fromEnv = process.env.ADMIN_NOTIFICATION_EMAILS?.trim();
  if (fromEnv) {
    const list = dedupeEmails(fromEnv.split(","));
    if (list.length > 0) return list;
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    const emails = dedupeEmails(admins.map((admin) => admin.email));
    if (emails.length > 0) return emails;
  } catch (error) {
    console.error("[notify] failed to load admin emails", error);
  }

  return [CONTACT_EMAIL];
}

/** Absolute URL for use in email links. */
export function emailSiteUrl(path = ""): string {
  const base = resolveSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type NotificationDetail = { label: string; value: string };

export type NotificationContent = {
  heading: string;
  /** Greeting line, e.g. "Hi Alex," */
  greeting?: string;
  /** Body paragraphs (plain text — will be escaped and wrapped in <p>). */
  paragraphs?: string[];
  /** Key/value rows rendered as a simple table. */
  details?: NotificationDetail[];
  /** Optional call-to-action button. */
  ctaUrl?: string;
  ctaLabel?: string;
  /** Optional image (e.g. a submitted screenshot) — rendered inline + linked. */
  imageUrl?: string;
  imageAlt?: string;
  /** Small muted note at the bottom (e.g. unsubscribe hint). */
  footnote?: string;
  /** Turn plain-text URLs in paragraphs into clickable links in HTML. */
  linkifyParagraphs?: boolean;
};

function linkifyEscapedHtml(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
    '<a href="$1" style="color:#e8222a;text-decoration:underline;">$1</a>',
  );
}

/** Builds branded HTML + plain-text bodies for a notification email. */
export function renderNotificationEmail(content: NotificationContent): {
  html: string;
  text: string;
} {
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  htmlParts.push(
    `<div style="background:#202121;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">`,
    `<div style="max-width:560px;margin:0 auto;background:#2a2b2b;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">`,
    `<div style="background:#1a1a1a;padding:20px 28px;border-bottom:2px solid ${BRAND_RED};">`,
    `<span style="color:#ffffff;font-size:18px;font-weight:bold;">Jackals <span style="color:${BRAND_RED};">VC</span></span>`,
    `</div>`,
    `<div style="padding:28px;color:#e5e5e5;font-size:15px;line-height:1.6;">`,
    `<h1 style="margin:0 0 16px;color:#ffffff;font-size:20px;">${escapeHtml(content.heading)}</h1>`,
  );
  textParts.push(`Jackals VC`, "", content.heading, "");

  if (content.greeting) {
    htmlParts.push(`<p style="margin:0 0 12px;">${escapeHtml(content.greeting)}</p>`);
    textParts.push(content.greeting, "");
  }

  for (const paragraph of content.paragraphs ?? []) {
    const escaped = escapeHtml(paragraph);
    htmlParts.push(
      `<p style="margin:0 0 12px;${paragraph.includes("\n") ? "white-space:pre-wrap;" : ""}">${
        content.linkifyParagraphs ? linkifyEscapedHtml(escaped) : escaped
      }</p>`,
    );
    textParts.push(paragraph, "");
  }

  if (content.details && content.details.length > 0) {
    htmlParts.push(
      `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;">`,
    );
    for (const detail of content.details) {
      htmlParts.push(
        `<tr>`,
        `<td style="padding:6px 12px 6px 0;color:#9a9a9a;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(detail.label)}</td>`,
        `<td style="padding:6px 0;color:#ffffff;font-size:14px;">${escapeHtml(detail.value)}</td>`,
        `</tr>`,
      );
      textParts.push(`${detail.label}: ${detail.value}`);
    }
    htmlParts.push(`</table>`);
    textParts.push("");
  }

  if (content.imageUrl) {
    const alt = escapeHtml(content.imageAlt ?? "Attached image");
    htmlParts.push(
      `<div style="margin:0 0 16px;">`,
      `<a href="${escapeHtml(content.imageUrl)}" target="_blank" rel="noopener" style="display:inline-block;">`,
      `<img src="${escapeHtml(content.imageUrl)}" alt="${alt}" style="max-width:240px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);" />`,
      `</a>`,
      `</div>`,
    );
    textParts.push(`Image: ${content.imageUrl}`, "");
  }

  if (content.ctaUrl && content.ctaLabel) {
    htmlParts.push(
      `<p style="margin:20px 0;">`,
      `<a href="${escapeHtml(content.ctaUrl)}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:bold;font-size:14px;">${escapeHtml(content.ctaLabel)}</a>`,
      `</p>`,
    );
    textParts.push(`${content.ctaLabel}: ${content.ctaUrl}`, "");
  }

  if (content.footnote) {
    htmlParts.push(
      `<p style="margin:20px 0 0;color:#8a8a8a;font-size:12px;line-height:1.5;">${escapeHtml(content.footnote)}</p>`,
    );
    textParts.push("", content.footnote);
  }

  htmlParts.push(
    `</div>`,
    `<div style="padding:16px 28px;background:#1a1a1a;color:#777;font-size:12px;border-top:1px solid rgba(255,255,255,0.06);">`,
    `Jackals Volleyball Club · <a href="${emailSiteUrl()}" style="color:${BRAND_RED};text-decoration:none;">jackalsvolleyball.com</a>`,
    `</div>`,
    `</div>`,
    `</div>`,
  );
  textParts.push("", "—", "Jackals Volleyball Club", emailSiteUrl());

  return { html: htmlParts.join(""), text: textParts.join("\n") };
}

/**
 * Sends a notification email. Never throws — returns `{ delivered: false }` and
 * logs if SMTP is not configured or sending fails, so callers can safely fire
 * these alongside the primary action without breaking it.
 */
export async function sendNotificationEmail(input: {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  content: NotificationContent;
  replyTo?: string;
}): Promise<{ delivered: boolean }> {
  const toList = dedupeEmails(
    input.to ? (Array.isArray(input.to) ? input.to : [input.to]) : [],
  );
  const bccList = dedupeEmails(
    input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : [],
  );

  if (toList.length === 0 && bccList.length === 0) {
    return { delivered: false };
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();

  if (!transporter || !from) {
    console.warn(
      `[notify] email not configured — skipping "${input.subject}"`,
    );
    return { delivered: false };
  }

  const { html, text } = renderNotificationEmail(input.content);

  try {
    await transporter.sendMail({
      from,
      // When only BCC recipients are given, address the email to the club itself.
      to: toList.length > 0 ? toList : from,
      bcc: bccList.length > 0 ? bccList : undefined,
      subject: input.subject,
      text,
      html,
      replyTo: input.replyTo,
    });
    return { delivered: true };
  } catch (error) {
    console.error(`[notify] failed to send "${input.subject}"`, error);
    return { delivered: false };
  }
}

/** Sends a notification to all resolved admin recipients (never throws). */
export async function notifyAdmins(input: {
  subject: string;
  content: NotificationContent;
  replyTo?: string;
}): Promise<{ delivered: boolean }> {
  const to = await getAdminNotificationEmails();
  return sendNotificationEmail({
    to,
    subject: input.subject,
    content: input.content,
    replyTo: input.replyTo,
  });
}
