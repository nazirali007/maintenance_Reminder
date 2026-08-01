import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { shouldLogOdometerReading } from "@/lib/odometer-projection";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const { vehicleId } = await ctx.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { maintenanceItems: true },
  });

  if (!vehicle || vehicle.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ vehicle });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const { vehicleId } = await ctx.params;

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!existing || existing.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });

  return Response.json({ success: true });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const { vehicleId } = await ctx.params;

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!existing || existing.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { variant, purchaseDate, ...rest } = parsed.data;

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...rest,
      variant: variant || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    },
  });

  if (shouldLogOdometerReading(existing.currentMileage, vehicle.currentMileage)) {
    await prisma.odometerLog.create({
      data: { vehicleId: vehicle.id, reading: vehicle.currentMileage },
    });
  }

  return Response.json({ vehicle });
}
