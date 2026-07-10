import {
  createPayloadResolver,
  getPayloadState,
  type PayloadRoot,
} from "@/lib/reclub-payload";
import {
  fetchReclubJson,
  RECLUB_CACHE_TTL_MS,
  withReclubRequestCache,
} from "@/lib/reclub-request-cache";

type ReclubLocation = {
  address?: string | null;
  locality?: string | null;
  region?: string | null;
  country?: string | null;
};

export type ReclubCompetition = {
  id: string;
  name: string;
  notes: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  sessionFee: number | null;
  paymentUrl: string | null;
  accessToken: string | null;
  isCancelled: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatLocation(location: ReclubLocation | null): string | null {
  if (!location) return null;

  const parts = [
    location.address,
    location.locality,
    location.region,
    location.country,
  ].filter((part): part is string => Boolean(part && part.trim()));

  return parts.length > 0 ? parts.join(", ") : null;
}

function extractPaymentUrl(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] ?? null;
}

function getCompetitionWrapper(
  data: PayloadRoot,
  competitionId: string,
): Record<string, unknown> | null {
  const state = getPayloadState(data);
  if (!state) return null;

  const wrapperIndex = state[`competition-${competitionId}`];
  if (typeof wrapperIndex !== "number") {
    return null;
  }

  const resolve = createPayloadResolver(data);
  const wrapper = resolve(wrapperIndex);
  return isRecord(wrapper) ? wrapper : null;
}

function getCompetitionState(
  data: PayloadRoot,
  competitionId: string,
): Record<string, unknown> | null {
  const wrapper = getCompetitionWrapper(data, competitionId);
  if (!wrapper) return null;

  const resolve = createPayloadResolver(data);
  const competitionValue = wrapper.competition;
  const resolved =
    typeof competitionValue === "number"
      ? resolve(competitionValue)
      : competitionValue;

  return isRecord(resolved) ? resolved : null;
}

export function parseReclubCompetitionPayload(
  payload: unknown,
  fallbackCompetitionId?: string,
): ReclubCompetition | null {
  if (!Array.isArray(payload)) return null;

  const data = payload as PayloadRoot;
  const competitionId =
    fallbackCompetitionId ??
    Object.keys(getPayloadState(data) ?? {})
      .find((key) => key.startsWith("competition-"))
      ?.replace(/^competition-/, "") ??
    null;

  if (!competitionId) return null;

  const competition = getCompetitionState(data, competitionId);
  if (!competition) return null;

  const id = readString(competition.id) ?? competitionId;
  const name = readString(competition.name);
  const startUnix = readNumber(competition.startDatetime);
  const status = readNumber(competition.status);

  if (!name || startUnix == null || status == null) {
    return null;
  }

  const endUnix = readNumber(competition.endDatetime);
  const durationSeconds = readNumber(competition.duration);
  const notes = readString(competition.notes);
  const startDate = new Date(startUnix * 1000);
  const endDate = endUnix
    ? new Date(endUnix * 1000)
    : durationSeconds
      ? new Date(startDate.getTime() + durationSeconds * 1000)
      : null;

  return {
    id,
    name,
    notes,
    startDate,
    endDate,
    location: formatLocation(
      isRecord(competition.location)
        ? (competition.location as ReclubLocation)
        : null,
    ),
    sessionFee: readNumber(competition.feeAmount),
    paymentUrl: extractPaymentUrl(notes),
    accessToken: readString(competition.accessToken),
    isCancelled: status < 0,
  };
}

async function fetchReclubCompetitionPayload(
  competitionId: string,
): Promise<ReclubCompetition | null> {
  const id = competitionId.trim();
  const response = await fetchReclubJson(
    `https://reclub.co/c/${id}/_payload.json`,
    { next: { revalidate: 120 } },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseReclubCompetitionPayload(payload, id);
}

export async function fetchReclubCompetition(
  competitionId: string,
): Promise<ReclubCompetition | null> {
  const id = competitionId.trim();
  return withReclubRequestCache(
    `competition-payload:${id}`,
    RECLUB_CACHE_TTL_MS.payload,
    () => fetchReclubCompetitionPayload(id),
  );
}
