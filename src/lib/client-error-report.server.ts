import "server-only";

import { createHash } from "node:crypto";
import { notifyAdmins } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

export type ClientErrorReport = {
  message: string;
  url?: string;
  endpoint?: string;
  status?: number;
  stack?: string;
  component?: string;
};

function reportDedupeKey(report: ClientErrorReport): string {
  const raw = [
    report.message,
    report.endpoint ?? "",
    report.url ?? "",
    String(report.status ?? ""),
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

export async function reportClientErrorToAdmins(
  report: ClientErrorReport,
): Promise<{ notified: boolean }> {
  const dedupeKey = reportDedupeKey(report);
  const limited = checkRateLimit(`client-error-notify:${dedupeKey}`, {
    limit: 1,
    windowMs: 15 * 60_000,
  });

  if (!limited.allowed) {
    return { notified: false };
  }

  const details = [
    { label: "Message", value: report.message.slice(0, 500) },
    ...(report.url ? [{ label: "Page", value: report.url }] : []),
    ...(report.endpoint ? [{ label: "API", value: report.endpoint }] : []),
    ...(report.status ? [{ label: "Status", value: String(report.status) }] : []),
    ...(report.component ? [{ label: "Component", value: report.component }] : []),
  ];

  const paragraphs = [
    "A member hit an error in the browser. They were shown a friendly message; details are below.",
  ];

  if (report.stack) {
    paragraphs.push(`Stack trace (truncated):\n${report.stack.slice(0, 1200)}`);
  }

  const { delivered } = await notifyAdmins({
    subject: `Site error — ${report.message.slice(0, 80)}`,
    content: {
      heading: "Member-facing error reported",
      paragraphs,
      details,
      ctaUrl: report.url,
      ctaLabel: "Open page",
    },
  });

  return { notified: delivered };
}
