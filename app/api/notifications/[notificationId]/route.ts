import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/notifications/[notificationId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

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
}
