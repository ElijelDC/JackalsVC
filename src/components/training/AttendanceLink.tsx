import Link from "next/link";

const outlineButtonClass =
  "inline-flex w-full items-center justify-center gap-2 border border-jackals-red/40 bg-jackals-red/10 px-4 py-2.5 text-sm font-semibold text-jackals-red-light transition-colors hover:border-jackals-red/60 hover:bg-jackals-red/20";

const primaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 border border-jackals-red bg-jackals-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jackals-red/90";

export function AttendanceLink({
  sessionId,
  basePath = "/training",
  occurrenceDate,
  label = "Register attendance on Reclub",
  variant = "outline",
  externalHref,
}: {
  sessionId: string;
  basePath?: string;
  occurrenceDate?: string | null;
  label?: string;
  variant?: "outline" | "primary";
  /** Opens the Reclub (or other external) registration page directly. */
  externalHref?: string | null;
}) {
  const className =
    variant === "primary" ? primaryButtonClass : outlineButtonClass;

  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  const query = occurrenceDate
    ? `?date=${encodeURIComponent(occurrenceDate)}`
    : "";

  return (
    <Link
      href={`${basePath}/${sessionId}/attend${query}`}
      className={className}
    >
      {label}
    </Link>
  );
}
