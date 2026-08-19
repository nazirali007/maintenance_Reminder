import { after } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { shouldLogOdometerReading } from "@/lib/odometer-projection";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";
import { checkAndNotifyDueMaintenance } from "@/lib/server/notifications";

const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  return withApiErrorHandling(async () => {
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
  });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(
      `vehicles-write:${userId}`,
      WRITE_RATE_LIMIT,
      WRITE_RATE_WINDOW_MS
    );
    if (limited) return limited;

    const { vehicleId } = await ctx.params;

    const existing = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    return Response.json({ success: true });
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(
      `vehicles-write:${userId}`,
      WRITE_RATE_LIMIT,
      WRITE_RATE_WINDOW_MS
    );
    if (limited) return limited;

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

    const { lastServiceDate, markItemsServiced, ...rest } = parsed.data;
    const serviceDate = lastServiceDate ? new Date(lastServiceDate) : null;

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { ...rest, lastServiceDate: serviceDate },
    });

    // The user confirmed the whole car was serviced at this reading, so bring
    // each tracked item's own history up to the same point — otherwise they'd
    // keep reporting overdue against their stale individual readings.
    if (markItemsServiced) {
      await prisma.maintenanceItem.updateMany({
        where: { vehicleId },
        data: {
          lastServiceMileage: vehicle.lastServiceMileage,
          lastServiceDate: serviceDate ?? new Date(),
        },
      });
    }

    if (shouldLogOdometerReading(existing.currentMileage, vehicle.currentMileage)) {
      await prisma.odometerLog.create({
        data: { vehicleId: vehicle.id, reading: vehicle.currentMileage },
      });
    }

    // Reflect the new readings in the bell straight away — this is what
    // clears reminders the user just resolved by logging the service.
    after(() => checkAndNotifyDueMaintenance(userId, [vehicleId]));

    return Response.json({ vehicle });
  });
}
