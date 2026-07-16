import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findRateLimitRule } from "@/lib/rate-limit-config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function buildCsp(frameAncestors: "'none'" | "'self'") {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ui-avatars.com https://*.cdninstagram.com https://assets.reclub.co https://*.cloudfront.net",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** Public docs that can be embedded in same-origin preview pages (like sponsors). */
function isEmbeddablePublicDoc(pathname: string) {
  return (
    pathname.startsWith("/downloads/") ||
    pathname.startsWith("/uploads/tournament-docs/")
  );
}

function applySecurityHeaders(response: NextResponse, pathname = "") {
  const embeddable = isEmbeddablePublicDoc(pathname);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (embeddable && key === "X-Frame-Options") {
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      continue;
    }
    response.headers.set(key, value);
  }

  response.headers.set(
    "Content-Security-Policy",
    buildCsp(embeddable ? "'self'" : "'none'"),
  );
}

function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    {
      error:
        "You're doing that a bit too quickly. Please wait a moment and try again.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}

function checkPathRateLimit(pathname: string, request: NextRequest) {
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/uploads/")) {
    return null;
  }

  const rule = findRateLimitRule(pathname, request.method);
  if (!rule) return null;

  const ip = getClientIp(request);
  const result = checkRateLimit(`${rule.prefix}:${request.method}:${ip}`, {
    limit: rule.limit,
    windowMs: rule.windowMs,
  });

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const limited = checkPathRateLimit(pathname, request);
  if (limited) {
    applySecurityHeaders(limited, pathname);
    return limited;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response, pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
