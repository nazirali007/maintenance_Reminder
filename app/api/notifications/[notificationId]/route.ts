import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";

const WRITE_RATE_LIMIT = 60;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/notifications/[notificationId]">
) {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(
      `notifications-write:${userId}`,
      WRITE_RATE_LIMIT,
      WRITE_RATE_WINDOW_MS
    );
    if (limited) return limited;

    const { notificationId } = await ctx.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "READ" },
    });

    return Response.json({ notification: updated });
  });
}
