export const OFFER_RESPONSE_STATUSES = ["ACCEPTED", "DECLINED"] as const;
export type OfferResponseStatus = (typeof OFFER_RESPONSE_STATUSES)[number];

export const OFFER_RESPONSE_STATUS_LABELS: Record<OfferResponseStatus, string> =
  {
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
  };

export function offerResponseStatusLabel(status: string) {
  return (
    OFFER_RESPONSE_STATUS_LABELS[status as OfferResponseStatus] ?? status
  );
}

export function offerResponseStatusBadgeClass(status: string) {
  if (status === "ACCEPTED") {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/25";
  }
  if (status === "DECLINED") {
    return "bg-rose-500/10 text-rose-300/90 ring-1 ring-inset ring-rose-500/20";
  }
  return "bg-zinc-500/15 text-zinc-300 ring-1 ring-inset ring-white/10";
}

export function formatOfferSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type FilterableOfferRow = {
  status: string;
  teamSlug: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  teamLabel: string;
};

export function filterOfferResponses<T extends FilterableOfferRow>(
  responses: T[],
  options: {
    status?: string | null;
    teamSlug?: string | null;
    search?: string | null;
    allowedStatuses?: readonly string[];
    allowedTeamSlugs?: readonly string[];
    extraSearchValues?: (row: T) => Array<string | number | null | undefined>;
  },
): T[] {
  const query = options.search?.trim().toLowerCase() ?? "";
  const statusOk =
    options.status &&
    (options.allowedStatuses ?? OFFER_RESPONSE_STATUSES).includes(options.status)
      ? options.status
      : null;
  const teamOk =
    options.teamSlug &&
    (options.allowedTeamSlugs ?? []).includes(options.teamSlug)
      ? options.teamSlug
      : null;

  return responses.filter((row) => {
    if (statusOk && row.status !== statusOk) return false;
    if (teamOk && row.teamSlug !== teamOk) return false;
    if (!query) return true;

    const haystack = [
      row.fullName,
      row.email,
      row.phoneNumber,
      row.teamLabel,
      row.status,
      ...(options.extraSearchValues?.(row) ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}
