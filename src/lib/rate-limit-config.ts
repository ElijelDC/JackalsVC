export type RateLimitRule = {
  prefix: string;
  limit: number;
  windowMs: number;
  /** When set, only applies to these HTTP methods. */
  methods?: string[];
};

/** Most specific prefix wins — keep strict rules before general ones. */
export const RATE_LIMIT_RULES: RateLimitRule[] = [
  { prefix: "/api/client-errors", limit: 5, windowMs: 300_000 },
  { prefix: "/api/contact", limit: 5, windowMs: 60_000 },
  { prefix: "/api/coaching-application", limit: 5, windowMs: 60_000 },
  { prefix: "/api/auth/verify-email-code", limit: 10, windowMs: 60_000 },
  { prefix: "/api/auth/send-email-code", limit: 8, windowMs: 60_000 },
  { prefix: "/api/auth/forgot-password", limit: 8, windowMs: 60_000 },
  { prefix: "/api/auth/validate-vly", limit: 15, windowMs: 60_000 },
  { prefix: "/api/auth/register", limit: 8, windowMs: 60_000 },
  { prefix: "/api/newsletter/subscribe", limit: 8, windowMs: 60_000 },
  { prefix: "/api/auth/", limit: 30, windowMs: 60_000 },
  {
    prefix: "/uploads/",
    limit: 600,
    windowMs: 60_000,
    methods: ["GET", "HEAD"],
  },
  {
    prefix: "/api/internal-uploads",
    limit: 600,
    windowMs: 60_000,
    methods: ["GET", "HEAD"],
  },
  {
    prefix: "/api/admin/",
    limit: 90,
    windowMs: 60_000,
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  },
  {
    prefix: "/api/",
    limit: 120,
    windowMs: 60_000,
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  },
  {
    prefix: "/api/",
    limit: 240,
    windowMs: 60_000,
    methods: ["GET", "HEAD"],
  },
];

export function findRateLimitRule(pathname: string, method: string) {
  const normalizedMethod = method.toUpperCase();
  return RATE_LIMIT_RULES.find(
    ({ prefix, methods }) =>
      pathname.startsWith(prefix) &&
      (!methods || methods.includes(normalizedMethod)),
  );
}
