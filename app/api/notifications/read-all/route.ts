import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";

export async function PATCH() {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  await prisma.notification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ" },
  });

  return Response.json({ success: true });
}
