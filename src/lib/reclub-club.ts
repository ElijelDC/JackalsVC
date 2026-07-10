import {
  createPayloadResolver,
  getPayloadState,
  type PayloadRoot,
} from "@/lib/reclub-payload";
import { DEFAULT_RECLUB_CLUB_SLUG, DEFAULT_RECLUB_GROUP_ID } from "@/lib/reclub-config";
import {
  fetchReclubJson,
  RECLUB_CACHE_TTL_MS,
  withReclubRequestCache,
} from "@/lib/reclub-request-cache";

export type ReclubClub = {
  id: number;
  refCode: string;
  slug: string;
  name: string;
};

export type ReclubActivitySummary =
  | {
      kind: "meet";
      referenceCode: string;
      name: string;
      startDate: Date;
      endDate: Date | null;
      status: number;
    }
  | {
      kind: "competition";
      competitionId: string;
      accessToken: string | null;
      name: string;
      startDate: Date;
      endDate: Date | null;
      status: number;
    };

/** Meet status 1 = active; competition status 3 = registration open. */
const UPCOMING_RECLUB_ACTIVITY_STATUSES = new Set([1, 3]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getClubState(data: PayloadRoot, slug: string): Record<string, unknown> | null {
  const state = getPayloadState(data);
  if (!state) return null;

  const wrapperIndex = state[`club-@${slug}`];
  if (typeof wrapperIndex !== "number") {
    return null;
  }

  const resolve = createPayloadResolver(data);
  const wrapper = resolve(wrapperIndex);
  if (!isRecord(wrapper)) {
    return null;
  }

  const clubValue = wrapper.club;
  const club =
    typeof clubValue === "number" ? resolve(clubValue) : clubValue;

  return isRecord(club) ? club : null;
}

function parseReclubClubPayload(
  payload: unknown,
  slug: string,
): ReclubClub | null {
  if (!Array.isArray(payload)) return null;

  const club = getClubState(payload as PayloadRoot, slug);
  if (!club) return null;

  const id = readNumber(club.id);
  const refCode = readString(club.refCode);
  const clubSlug = readString(club.slug);
  const name = readString(club.name);

  if (id == null || !refCode || !clubSlug || !name) {
    return null;
  }

  return { id, refCode, slug: clubSlug, name };
}

function parseReclubActivitySummary(
  item: unknown,
): ReclubActivitySummary | null {
  if (!isRecord(item)) return null;

  const name = readString(item.name);
  const startUnix = readNumber(item.startDatetime);
  const status = readNumber(item.status);
  const context = readString(item.context);
  const competitionId = readString(item.id);
  const referenceCode = readString(item.referenceCode);

  if (!name || startUnix == null || status == null) {
    return null;
  }

  const endUnix = readNumber(item.endDatetime);
  const durationSeconds = readNumber(item.duration);
  const startDate = new Date(startUnix * 1000);
  const endDate = endUnix
    ? new Date(endUnix * 1000)
    : durationSeconds
      ? new Date(startDate.getTime() + durationSeconds * 1000)
      : null;

  if (context === "competition" || (!referenceCode && competitionId)) {
    if (!competitionId) return null;

    return {
      kind: "competition",
      competitionId,
      accessToken: readString(item.accessToken),
      name,
      startDate,
      endDate,
      status,
    };
  }

  if (!referenceCode) return null;

  return {
    kind: "meet",
    referenceCode: referenceCode.toUpperCase(),
    name,
    startDate,
    endDate,
    status,
  };
}

export async function fetchReclubClub(slug: string): Promise<ReclubClub | null> {
  const response = await fetch(`https://reclub.co/clubs/@${slug}/_payload.json`, {
    headers: {
      "User-Agent": "JackalsVC-ReclubSync/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseReclubClubPayload(payload, slug);
}

export async function fetchReclubClubActivities(
  groupId: number,
): Promise<ReclubActivitySummary[]> {
  return withReclubRequestCache(
    `club-activities:${groupId}`,
    RECLUB_CACHE_TTL_MS.activities,
    () => fetchReclubClubActivitiesPayload(groupId),
  );
}

async function fetchReclubClubActivitiesPayload(
  groupId: number,
): Promise<ReclubActivitySummary[]> {
  const response = await fetchReclubJson(
    `https://api.reclub.co/groups/${groupId}/activities`,
    { next: { revalidate: 120 } },
  );

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => parseReclubActivitySummary(item))
    .filter((item): item is ReclubActivitySummary => item !== null);
}

export function filterUpcomingReclubActivities(
  activities: ReclubActivitySummary[],
  now = new Date(),
): ReclubActivitySummary[] {
  const nowUnix = now.getTime() / 1000;

  return activities
    .filter(
      (activity) =>
        UPCOMING_RECLUB_ACTIVITY_STATUSES.has(activity.status) &&
        activity.startDate.getTime() / 1000 >= nowUnix,
    )
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime());
}

export async function resolveReclubGroupId(): Promise<number | null> {
  const fromEnv = process.env.RECLUB_GROUP_ID?.trim();
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const slug = process.env.RECLUB_CLUB_SLUG?.trim() || DEFAULT_RECLUB_CLUB_SLUG;
  const club = await fetchReclubClub(slug);
  return club?.id ?? DEFAULT_RECLUB_GROUP_ID;
}

export async function fetchUpcomingReclubClubActivities(
  groupId?: number,
): Promise<ReclubActivitySummary[]> {
  const resolvedGroupId = groupId ?? (await resolveReclubGroupId());
  if (!resolvedGroupId) {
    return [];
  }

  const activities = await fetchReclubClubActivities(resolvedGroupId);
  return filterUpcomingReclubActivities(activities);
}
