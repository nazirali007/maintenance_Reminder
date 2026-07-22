import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, status: "UNREAD" },
    data: { status: "READ" },
  });

  return Response.json({ success: true });
}
