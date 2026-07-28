import { NextResponse } from "next/server";
import { auth } from "@/auth";

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

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const { pathname } = nextUrl;

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
});

export const config = {
  matcher: [
    // Skip API routes, Next.js internals, and any request for a static file
    // (anything with a file extension, e.g. images under /public) — those
    // should never be gated behind auth.
    "/((?!api|_next/static|_next/image|.*\\..*).*)",
  ],
};
