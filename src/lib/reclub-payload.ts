type PayloadRoot = unknown[];

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

function getMeetState(data: PayloadRoot): Record<string, unknown> | null {
  const rootState = data[2];
  if (!Array.isArray(rootState) || !isRecord(rootState[1])) {
    return null;
  }

  const state = rootState[1];
  const meetKey = Object.keys(state).find((key) => key.startsWith("meet-"));
  if (!meetKey) return null;

  const wrapperIndex = state[meetKey];
  if (typeof wrapperIndex !== "number") return null;

  const wrapper = data[wrapperIndex];
  if (!isRecord(wrapper) || typeof wrapper.meet !== "number") {
    return null;
  }

  const resolve = createPayloadResolver(data);
  const resolved = resolve(wrapper.meet);
  return isRecord(resolved) ? resolved : null;
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

export async function fetchReclubMeet(referenceCode: string): Promise<ReclubMeet | null> {
  const code = referenceCode.trim().toUpperCase();
  const response = await fetch(`https://reclub.co/m/${code}/_payload.json`, {
    headers: {
      "User-Agent": "JackalsVC-ReclubSync/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseReclubMeetPayload(payload, code);
}
