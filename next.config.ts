import type { NextConfig } from "next";

// A strict Content-Security-Policy is deliberately not set here — getting it
// wrong (e.g. blocking Google's OAuth redirect or Next's own hydration
// scripts) fails silently in the browser console, and isn't something that
// can be caught by build-time or curl-based checks. The headers below are
// lower-risk and cover the most common attack classes without needing a
// per-script/style allowlist.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
