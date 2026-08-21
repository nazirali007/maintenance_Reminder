import { after } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { maintenanceChecklistSchema } from "@/lib/validations/maintenance";
import { shouldLogOdometerReading } from "@/lib/odometer-projection";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";
import { checkAndNotifyDueMaintenance } from "@/lib/server/notifications";

const GENERAL_NOTE_INTERVAL_KM = 200000;
const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/maintenance-items">
) {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(
      `maintenance-items-write:${userId}`,
      WRITE_RATE_LIMIT,
      WRITE_RATE_WINDOW_MS
    );
    if (limited) return limited;

    const { vehicleId } = await ctx.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.userId !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = maintenanceChecklistSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { lastServiceMileage, lastServiceDate, notes, items } = parsed.data;
    const trimmedNotes = notes?.trim() || null;
    const serviceDate = new Date(lastServiceDate);

    const rowsToCreate =
      items.length > 0
        ? items.map((item) => ({
            name: item.name,
            intervalKm: item.intervalKm,
            lastServiceMileage,
            lastServiceDate: serviceDate,
            notes: trimmedNotes,
            vehicleId,
          }))
        : [
            {
              name: "General Note",
              intervalKm: GENERAL_NOTE_INTERVAL_KM,
              lastServiceMileage,
              lastServiceDate: serviceDate,
              notes: trimmedNotes,
              vehicleId,
            },
          ];

    const maintenanceItems = await prisma.$transaction(
      rowsToCreate.map((data) => prisma.maintenanceItem.create({ data }))
    );

    // This endpoint IS the "I got my car serviced" flow, so the car's own
    // last-service baseline has to move with it. Without this, logging a
    // service at 30,000 km left the vehicle still recorded as last serviced at
    // 20,000 km, and the blanket 10,000 km rule immediately reported the car
    // as overdue the moment the user finished telling us it was serviced.
    //
    // Only ever moves forward: back-dating an older service (a lower reading)
    // must not drag the baseline — or the car's due date — backwards.
    const isNewerService = lastServiceMileage > vehicle.lastServiceMileage;

    if (isNewerService || shouldLogOdometerReading(vehicle.currentMileage, lastServiceMileage)) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...(shouldLogOdometerReading(vehicle.currentMileage, lastServiceMileage) && {
            currentMileage: lastServiceMileage,
          }),
          ...(isNewerService && {
            lastServiceMileage,
            lastServiceDate: serviceDate,
          }),
        },
      });
    }

    if (shouldLogOdometerReading(vehicle.currentMileage, lastServiceMileage)) {
      await prisma.odometerLog.create({
        data: { vehicleId, reading: lastServiceMileage },
      });
    }

    // Clears any reminders the user just resolved by logging this service.
    after(() => checkAndNotifyDueMaintenance(userId, [vehicleId]));

    return Response.json({ maintenanceItems }, { status: 201 });
  });
}
