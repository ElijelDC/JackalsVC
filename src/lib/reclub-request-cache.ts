type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const resultCache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

export const RECLUB_CACHE_TTL_MS = {
  /** Browse-triggered club sync (events page). */
  clubSync: 5 * 60 * 1000,
  /** Meet / competition participant lists on event detail. */
  participants: 2 * 60 * 1000,
  /** Payload fetches used during sync. */
  payload: 2 * 60 * 1000,
  /** Club activities list used during sync. */
  activities: 2 * 60 * 1000,
} as const;

const MAX_CACHE_ENTRIES = 128;

function pruneExpiredEntries(now = Date.now()) {
  for (const [key, entry] of resultCache) {
    if (entry.expiresAt <= now) {
      resultCache.delete(key);
    }
  }

  if (resultCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const sorted = [...resultCache.entries()].sort(
    (left, right) => left[1].expiresAt - right[1].expiresAt,
  );

  for (const [key] of sorted.slice(0, resultCache.size - MAX_CACHE_ENTRIES)) {
    resultCache.delete(key);
  }
}

/**
 * Coalesce concurrent Reclub reads and keep short-lived in-memory results so
 * rapid navigation cannot stampede the external API.
 */
export async function withReclubRequestCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  pruneExpiredEntries(now);

  const cached = resultCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const inflight = inflightRequests.get(key);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const promise = fetcher()
    .then((value) => {
      resultCache.set(key, { expiresAt: now + ttlMs, value });
      inflightRequests.delete(key);
      return value;
    })
    .catch((error) => {
      inflightRequests.delete(key);
      throw error;
    });

  inflightRequests.set(key, promise);
  return promise as Promise<T>;
}

export const RECLUB_FETCH_TIMEOUT_MS = 12_000;

export async function fetchReclubJson(
  url: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
): Promise<Response> {
  const { next, ...requestInit } = init;

  return fetch(url, {
    ...requestInit,
    signal: requestInit.signal ?? AbortSignal.timeout(RECLUB_FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "JackalsVC-ReclubSync/1.0",
      Accept: "application/json",
      ...requestInit.headers,
    },
    next: next ?? { revalidate: 120 },
  });
}
