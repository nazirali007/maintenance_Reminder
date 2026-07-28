import "server-only";
import { prisma } from "@/lib/server/prisma";

export interface RateLimitResult {
  allowed: boolean;
}

/**
 * Simple fixed-window rate limiter backed by Postgres (no Redis dependency
 * at this app's scale). Not perfectly atomic under heavy concurrency — a
 * burst of parallel requests could slip a few over the limit — but that's an
 * acceptable tradeoff for throttling casual abuse, not defending against a
 * determined distributed attacker.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false };
  }

  await prisma.rateLimitEntry.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true };
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
