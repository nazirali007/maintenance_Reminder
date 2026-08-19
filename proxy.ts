import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getClientIp, rateLimitedResponse } from "@/lib/server/rate-limit";

// Blanket backstop for every API route, on top of the tighter per-user/
// per-email limits individual routes already enforce — this is what stops a
// script hammering any endpoint (or one we haven't specifically throttled)
// from taking the app down. Generous enough that normal usage never gets
// near it.
//
// Kept in memory rather than Postgres: this runs on EVERY API request, and a
// DB round trip here was adding 200ms+ of latency to every call (worst with
// a cross-region database). Per warm server instance is plenty for a
// backstop — a flood hits the same warm instance and still gets throttled —
// while the abuse-sensitive routes (auth, writes) keep their durable
// DB-backed per-user/per-email limits.
const API_RATE_LIMIT = 60;
const API_RATE_WINDOW_MS = 10 * 1000; // 10 seconds
const BUCKET_SWEEP_THRESHOLD = 10_000;

const apiHits = new Map<string, { count: number; windowStart: number }>();

function isApiRateLimited(key: string): boolean {
  const now = Date.now();

  // Bound memory: drop expired buckets once the map gets large.
  if (apiHits.size > BUCKET_SWEEP_THRESHOLD) {
    for (const [k, v] of apiHits) {
      if (now - v.windowStart > API_RATE_WINDOW_MS) apiHits.delete(k);
    }
  }

  const bucket = apiHits.get(key);
  if (!bucket || now - bucket.windowStart > API_RATE_WINDOW_MS) {
    apiHits.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > API_RATE_LIMIT;
}

// Pages that only make sense when logged out — an authenticated visitor
// gets bounced to the dashboard instead of seeing them.
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Pages anyone can view regardless of auth state. Includes dynamic
// file-convention routes with no extension in their URL (e.g. the OG image)
// — those must stay reachable by social-media crawlers, which never carry a
// session cookie, and wouldn't otherwise be excluded by the static-file
// matcher below.
const PUBLIC_PATHS = ["/about", "/opengraph-image"];

function matchesPath(paths: string[], pathname: string) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default auth(async (req) => {
  // Every page and API request passes through here, so a thrown error would
  // break the entire app rather than one route — fail open (let the request
  // through) instead. enforceRateLimit already fails open internally; this
  // is a second layer for anything else in this function (redirect URL
  // construction, req.auth access, etc.).
  try {
    const { nextUrl } = req;
    const { pathname } = nextUrl;

    if (pathname.startsWith("/api")) {
      if (isApiRateLimited(getClientIp(req))) {
        return rateLimitedResponse();
      }
      return NextResponse.next();
    }

    const isAuthenticated = !!req.auth;

    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(isAuthenticated ? "/dashboard" : "/login", nextUrl)
      );
    }

    if (matchesPath(PUBLIC_PATHS, pathname)) {
      return NextResponse.next();
    }

    if (matchesPath(GUEST_ONLY_PATHS, pathname)) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Proxy failed — failing open:", err);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Runs on API routes too now (for the rate-limit backstop above) but
    // skips Next.js internals and any request for a static file (anything
    // with a file extension, e.g. images under /public) — those should
    // never be gated behind auth or rate-limited.
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
