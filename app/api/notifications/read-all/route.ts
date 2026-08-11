import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";

const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function PATCH() {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(
      `notifications-read-all:${userId}`,
      WRITE_RATE_LIMIT,
      WRITE_RATE_WINDOW_MS
    );
    if (limited) return limited;

    await prisma.notification.updateMany({
      where: { userId, status: "UNREAD" },
      data: { status: "READ" },
    });

    return Response.json({ success: true });
  });
}
