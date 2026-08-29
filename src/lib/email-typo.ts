/**
 * Catch common email typos (.con, gnail, etc.) after basic format checks.
 */

const DOMAIN_CORRECTIONS: Record<string, string> = {
  "gnail.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.cpm": "gmail.com",
  "gmail.comm": "gmail.com",
  "hotnail.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.cm": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.cm": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  "icloud.con": "icloud.com",
  "icloud.co": "icloud.com",
  "icloud.cm": "icloud.com",
  "live.con": "live.com",
  "live.co": "live.com",
  "protonmail.con": "protonmail.com",
  "proton.me.con": "proton.me",
};

const TLD_CORRECTIONS: Record<string, string> = {
  con: "com",
  cpm: "com",
  cm: "com",
  om: "com",
  coo: "com",
  comm: "com",
};

export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  const domainFix = DOMAIN_CORRECTIONS[domain];
  if (domainFix) {
    return `${local}@${domainFix}`;
  }

  const dot = domain.lastIndexOf(".");
  if (dot > 0) {
    const host = domain.slice(0, dot);
    const tld = domain.slice(dot + 1);
    const tldFix = TLD_CORRECTIONS[tld];
    if (tldFix) {
      return `${local}@${host}.${tldFix}`;
    }
  }

  return null;
}

/** Returns a user-facing error, or null when the email looks fine. */
export function emailTypoError(email: string): string | null {
  const suggestion = suggestEmailCorrection(email);
  if (!suggestion) return null;
  return `That email looks mistyped — did you mean ${suggestion}?`;
}
