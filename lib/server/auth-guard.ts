import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  // A JWT session cookie stays validly-signed even after its user row is
  // gone from the DB (account deletion, or the row disappearing some other
  // way while the browser still holds the old cookie) — sessions here
  // aren't tied to a DB session table. Without this check, a stale session
  // sails through every auth gate and only fails once something tries to
  // write with that userId, as a confusing foreign-key-violation 500.
  // Verify existence so a stale session fails clean instead: 401, and the
  // client re-prompts sign-in.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user ? userId : null;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
