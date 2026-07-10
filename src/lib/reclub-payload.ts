import {
  fetchReclubJson,
  RECLUB_CACHE_TTL_MS,
  withReclubRequestCache,
} from "@/lib/reclub-request-cache";

export type PayloadRoot = unknown[];

type ReclubLocation = {
  address?: string | null;
  locality?: string | null;
  region?: string | null;
  country?: string | null;
};

export type ReclubMeet = {
  referenceCode: string;
  name: string;
  notes: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  sessionFee: number | null;
  paymentUrl: string | null;
  isPast: boolean;
  isCancelled: boolean;
};

export type ReclubMeetParticipant = {
  name: string;
  imageUrl: string | null;
  isHost: boolean;
};

const RECLUB_CONFIRMED_PARTICIPANT_STATUS = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createPayloadResolver(data: PayloadRoot) {
  const resolving = new Set<number>();

  function resolve(value: unknown): unknown {
    if (typeof value !== "number" || value < 0 || value >= data.length) {
      return value;
    }

    if (resolving.has(value)) {
      return null;
    }

    resolving.add(value);
    const entry = data[value];
    resolving.delete(value);

    if (Array.isArray(entry)) {
      const [tag, payload] = entry;
      if (tag === "Reactive" || tag === "ShallowReactive" || tag === "Ref") {
        return resolve(payload);
      }
      if (tag === "EmptyRef") {
        return null;
      }
      return entry.map((item) => resolve(item));
    }

    if (isRecord(entry)) {
      return Object.fromEntries(
        Object.entries(entry).map(([key, nested]) => [key, resolve(nested)]),
      );
    }

    return entry;
  }

  return resolve;
}

function readBoolean(value: unknown): boolean {
  return value === true;
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

export function getPayloadState(data: PayloadRoot): Record<string, unknown> | null {
  const rootState = data[2];

  if (Array.isArray(rootState)) {
    return isRecord(rootState[1]) ? rootState[1] : null;
  }

  return isRecord(rootState) ? rootState : null;
}

function getMeetWrapper(
  data: PayloadRoot,
): Record<string, unknown> | null {
  const state = getPayloadState(data);
  if (!state) return null;

  const meetKey = Object.keys(state).find((key) => key.startsWith("meet-"));
  if (!meetKey) return null;

  const wrapperIndex = state[meetKey];
  if (typeof wrapperIndex !== "number") return null;

  const resolve = createPayloadResolver(data);
  const wrapper = resolve(wrapperIndex);
  return isRecord(wrapper) ? wrapper : null;
}

function getMeetState(data: PayloadRoot): Record<string, unknown> | null {
  const wrapper = getMeetWrapper(data);
  if (!wrapper) return null;

  const resolve = createPayloadResolver(data);
  const meetValue = wrapper.meet;
  const resolved =
    typeof meetValue === "number" ? resolve(meetValue) : meetValue;

  return isRecord(resolved) ? resolved : null;
}

export function parseReclubMeetParticipants(
  payload: unknown,
): ReclubMeetParticipant[] {
  if (!Array.isArray(payload)) return [];

  const data = payload as PayloadRoot;
  const wrapper = getMeetWrapper(data);
  const meet = getMeetState(data);

  if (!wrapper || !meet || !Array.isArray(meet.participants)) {
    return [];
  }

  const usersMap = isRecord(wrapper.usersMap) ? wrapper.usersMap : {};

  return meet.participants
    .filter(
      (participant): participant is Record<string, unknown> =>
        isRecord(participant) &&
        participant.status === RECLUB_CONFIRMED_PARTICIPANT_STATUS,
    )
    .map((participant) => {
      const userId = String(participant.referenceId ?? "");
      const user = isRecord(usersMap[userId]) ? usersMap[userId] : null;
      const name = user ? readString(user.name) : null;

      if (!name) return null;

      return {
        name,
        imageUrl: user ? readString(user.imageUrl) : null,
        isHost: participant.isHost === true,
      };
    })
    .filter((participant): participant is ReclubMeetParticipant => participant !== null);
}

export function parseReclubMeetPayload(
  payload: unknown,
  fallbackReferenceCode?: string,
): ReclubMeet | null {
  if (!Array.isArray(payload)) return null;

  const meet = getMeetState(payload);
  if (!meet) return null;

  const referenceCode =
    readString(meet.referenceCode) ?? fallbackReferenceCode ?? null;
  const name = readString(meet.name);
  const startUnix = readNumber(meet.startDatetime);

  if (!referenceCode || !name || startUnix == null) {
    return null;
  }

  const endUnix = readNumber(meet.endDatetime);
  const durationSeconds = readNumber(meet.duration);
  const notes = readString(meet.notes);
  const location = formatLocation(
    isRecord(meet.location) ? (meet.location as ReclubLocation) : null,
  );

  const startDate = new Date(startUnix * 1000);
  const endDate = endUnix
    ? new Date(endUnix * 1000)
    : durationSeconds
      ? new Date(startDate.getTime() + durationSeconds * 1000)
      : null;

  return {
    referenceCode: referenceCode.toUpperCase(),
    name,
    notes,
    startDate,
    endDate,
    location,
    sessionFee: readNumber(meet.feeAmount),
    paymentUrl: extractPaymentUrl(notes),
    isPast: readBoolean(meet.isPast),
    isCancelled: readBoolean(meet.isCancelled),
  };
}

async function fetchReclubMeetPayload(
  referenceCode: string,
): Promise<ReclubMeet | null> {
  const code = referenceCode.trim().toUpperCase();
  const response = await fetchReclubJson(
    `https://reclub.co/m/${code}/_payload.json`,
    { next: { revalidate: 120 } },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseReclubMeetPayload(payload, code);
}

export async function fetchReclubMeet(
  referenceCode: string,
): Promise<ReclubMeet | null> {
  const code = referenceCode.trim().toUpperCase();
  return withReclubRequestCache(
    `meet-payload:${code}`,
    RECLUB_CACHE_TTL_MS.payload,
    () => fetchReclubMeetPayload(code),
  );
}

async function fetchReclubMeetConfirmedParticipantsPayload(
  referenceCode: string,
): Promise<ReclubMeetParticipant[]> {
  const code = referenceCode.trim().toUpperCase();
  const response = await fetchReclubJson(
    `https://reclub.co/m/${code}/_payload.json`,
    { next: { revalidate: 120 } },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown;
  return parseReclubMeetParticipants(payload);
}

export async function fetchReclubMeetConfirmedParticipants(
  referenceCode: string,
): Promise<ReclubMeetParticipant[]> {
  const code = referenceCode.trim().toUpperCase();
  return withReclubRequestCache(
    `meet-participants:${code}`,
    RECLUB_CACHE_TTL_MS.participants,
    () => fetchReclubMeetConfirmedParticipantsPayload(code),
  );
}
