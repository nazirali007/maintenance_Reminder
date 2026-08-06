import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { maintenanceItemSchema } from "@/lib/validations/maintenance";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

async function loadOwnedItem(userId: string, vehicleId: string, itemId: string) {
  const item = await prisma.maintenanceItem.findUnique({
    where: { id: itemId },
    include: { vehicle: true },
  });

  if (!item || item.vehicleId !== vehicleId || item.vehicle.userId !== userId) {
    return null;
  }

  return item;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/maintenance-items/[itemId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const limited = await enforceRateLimit(
    `maintenance-items-write:${userId}`,
    WRITE_RATE_LIMIT,
    WRITE_RATE_WINDOW_MS
  );
  if (limited) return limited;

  const { vehicleId, itemId } = await ctx.params;

  const existing = await loadOwnedItem(userId, vehicleId, itemId);
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = maintenanceItemSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { notes, lastServiceDate, ...rest } = parsed.data;

  const maintenanceItem = await prisma.maintenanceItem.update({
    where: { id: itemId },
    data: {
      ...rest,
      lastServiceDate: new Date(lastServiceDate),
      notes: notes?.trim() || null,
    },
  });

  return Response.json({ maintenanceItem });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/maintenance-items/[itemId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const limited = await enforceRateLimit(
    `maintenance-items-write:${userId}`,
    WRITE_RATE_LIMIT,
    WRITE_RATE_WINDOW_MS
  );
  if (limited) return limited;

  const { vehicleId, itemId } = await ctx.params;

  const existing = await loadOwnedItem(userId, vehicleId, itemId);
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.maintenanceItem.delete({ where: { id: itemId } });

  return Response.json({ success: true });
}
