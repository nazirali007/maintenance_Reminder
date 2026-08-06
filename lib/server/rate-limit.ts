import "server-only";
import { prisma } from "@/lib/server/prisma";

export interface RateLimitResult {
  allowed: boolean;
}

/**
 * Fixed-window rate limiter backed by Postgres (no Redis dependency at this
 * app's scale). The increment-and-compare happens in a single INSERT ...
 * ON CONFLICT DO UPDATE statement, so it's atomic under concurrency — a
 * genuine burst of parallel requests (the exact thing this exists to stop)
 * can't all read a stale count and slip through; Postgres serializes
 * concurrent upserts on the same key via row-level locking.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitEntry" AS r (key, count, "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN r."windowStart" < ${cutoff} THEN 1
        ELSE r.count + 1
      END,
      "windowStart" = CASE
        WHEN r."windowStart" < ${cutoff} THEN ${now}
        ELSE r."windowStart"
      END
    RETURNING count;
  `;

  const count = rows[0]?.count ?? 1;
  return { allowed: count <= limit };
}

/**
 * Convenience wrapper for the common "check the limit, bail out with a 429
 * if it's exceeded" pattern used at the top of route handlers.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<Response | null> {
  const { allowed } = await checkRateLimit(key, limit, windowMs);
  return allowed ? null : rateLimitedResponse();
}

/**
 * Rate-limit rows are never deleted on the request path (a fixed-window
 * counter needs its row to persist across the window), so without this the
 * table grows by one row per distinct key (IP/user/email) forever. Called
 * once a day from the maintenance cron — a day-old window is always expired
 * regardless of that key's limit, so it's always safe to drop.
 */
export async function pruneStaleRateLimitEntries(maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const { count } = await prisma.rateLimitEntry.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return count;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function rateLimitedResponse() {
  return Response.json(
    { error: { form: ["Too many attempts. Please try again later."] } },
    { status: 429 }
  );
}
