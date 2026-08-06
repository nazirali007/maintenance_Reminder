import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { profileSchema } from "@/lib/validations/settings";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const WRITE_RATE_LIMIT = 10;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function PATCH(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const limited = await enforceRateLimit(
    `user-write:${userId}`,
    WRITE_RATE_LIMIT,
    WRITE_RATE_WINDOW_MS
  );
  if (limited) return limited;

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  return Response.json({ user });
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const limited = await enforceRateLimit(
    `user-write:${userId}`,
    WRITE_RATE_LIMIT,
    WRITE_RATE_WINDOW_MS
  );
  if (limited) return limited;

  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}
