import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit";

// Blanket backstop for every API route, on top of the tighter per-user/
// per-email limits individual routes already enforce — this is what stops a
// script hammering any endpoint (or one we haven't specifically throttled)
// from taking the app down. Generous enough that normal usage never gets
// near it.
const API_RATE_LIMIT = 60;
const API_RATE_WINDOW_MS = 10 * 1000; // 10 seconds

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
      const limited = await enforceRateLimit(
        `api:${getClientIp(req)}`,
        API_RATE_LIMIT,
        API_RATE_WINDOW_MS
      );
      return limited ?? NextResponse.next();
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
