import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceItemSchema } from "@/lib/validations/maintenance";

async function loadOwnedItem(
  session: { user: { id: string } },
  vehicleId: string,
  itemId: string
) {
  const item = await prisma.maintenanceItem.findUnique({
    where: { id: itemId },
    include: { vehicle: true },
  });

  if (
    !item ||
    item.vehicleId !== vehicleId ||
    item.vehicle.userId !== session.user.id
  ) {
    return null;
  }

  return item;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/maintenance-items/[itemId]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId, itemId } = await ctx.params;

  const existing = await loadOwnedItem(
    { user: { id: session.user.id } },
    vehicleId,
    itemId
  );
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
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId, itemId } = await ctx.params;

  const existing = await loadOwnedItem(
    { user: { id: session.user.id } },
    vehicleId,
    itemId
  );
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.maintenanceItem.delete({ where: { id: itemId } });

  return Response.json({ success: true });
}
