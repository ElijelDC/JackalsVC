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

export type ReclubFetchOptions = {
  /** Bypass in-memory + Next fetch caches (cron / forced sync). */
  forceRefresh?: boolean;
};

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

/** Drop cached Reclub reads so the next sync sees time/location changes. */
export function clearReclubRequestCache(prefix?: string) {
  if (!prefix) {
    resultCache.clear();
    return;
  }

  for (const key of resultCache.keys()) {
    if (key.startsWith(prefix)) {
      resultCache.delete(key);
    }
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
  options: ReclubFetchOptions = {},
): Promise<T> {
  const now = Date.now();
  pruneExpiredEntries(now);

  if (options.forceRefresh) {
    resultCache.delete(key);
  } else {
    const cached = resultCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }
  }

  const inflight = inflightRequests.get(key);
  if (inflight && !options.forceRefresh) {
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
  init: RequestInit & {
    next?: { revalidate?: number };
    forceRefresh?: boolean;
  } = {},
): Promise<Response> {
  const { next, forceRefresh = false, cache, ...requestInit } = init;
  const bypassCache = forceRefresh || cache === "no-store";

  return fetch(url, {
    ...requestInit,
    signal: requestInit.signal ?? AbortSignal.timeout(RECLUB_FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "JackalsVC-ReclubSync/1.0",
      Accept: "application/json",
      ...requestInit.headers,
    },
    ...(bypassCache
      ? { cache: "no-store" as const }
      : { cache, next: next ?? { revalidate: 120 } }),
  });
}
