import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { maintenanceChecklistSchema } from "@/lib/validations/maintenance";
import { shouldLogOdometerReading } from "@/lib/odometer-projection";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";

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

    if (shouldLogOdometerReading(vehicle.currentMileage, lastServiceMileage)) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: lastServiceMileage },
      });
      await prisma.odometerLog.create({
        data: { vehicleId, reading: lastServiceMileage },
      });
    }

    return Response.json({ maintenanceItems }, { status: 201 });
  });
}
