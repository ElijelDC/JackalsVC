export type ParsedIncomingPaymentEmail = {
  amount: number;
  reference: string;
  receivedAt?: Date;
  currency: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeQuotedPrintable(value: string): string {
  return value
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function normalizeEmailText(subject: string, text: string, html?: string): string {
  const parts = [subject, decodeQuotedPrintable(text)];
  if (html) parts.push(stripHtml(html));
  return parts.filter(Boolean).join("\n");
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s+/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:received|incoming|credit(?:ed)?|amount|total|paid)[^€$£0-9]{0,24}(?:€|EUR\s*)?(\d+(?:[.,]\d{2})?)/gi,
    /(?:€|EUR\s*)(\d+(?:[.,]\d{2})?)/gi,
    /(\d+(?:[.,]\d{2})?)\s*(?:€|EUR)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const amount = parseAmount(match[1] ?? "");
      if (amount != null && amount > 0) return amount;
    }
  }

  return null;
}

function cleanReference(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s:.-]+|[\s:.-]+$/g, "")
    .trim();
}

function extractReference(text: string): string | null {
  const labeledPatterns = [
    /(?:payment\s*)?reference\s*[:\-]\s*(.+)/i,
    /(?:transfer\s*)?reference\s*[:\-]\s*(.+)/i,
    /(?:message|memo|description|details)\s*[:\-]\s*(.+)/i,
    /(?:from|sender)\s*[:\-]\s*(.+)/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const reference = cleanReference(match[1].split("\n")[0] ?? "");
    if (reference.length >= 3 && reference.length <= 120) {
      return reference;
    }
  }

  const subjectReference = text
    .split("\n")[0]
    ?.replace(/^.*?(?:received|incoming|transfer|payment)/i, "")
    .trim();

  if (subjectReference && subjectReference.length >= 3 && subjectReference.length <= 120) {
    return cleanReference(subjectReference);
  }

  return null;
}

export function isLikelySumUpPaymentEmail(from: string, subject: string): boolean {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (fromLower.includes("sumup")) return true;

  return (
    subjectLower.includes("sumup") ||
    subjectLower.includes("received") ||
    subjectLower.includes("incoming") ||
    subjectLower.includes("transfer") ||
    subjectLower.includes("business account")
  );
}

export function parseIncomingPaymentEmail(
  subject: string,
  text: string,
  html?: string,
): ParsedIncomingPaymentEmail | null {
  const normalized = normalizeEmailText(subject, text, html);
  const amount = extractAmount(normalized);
  const reference = extractReference(normalized);

  if (amount == null || !reference) return null;

  return {
    amount,
    reference,
    currency: "EUR",
  };
}

export function getEmailSearchText(subject: string, text: string, html?: string): string {
  return normalizeEmailText(subject, text, html);
}
