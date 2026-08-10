import { after } from "next/server";

import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { odometerUpdateSchema } from "@/lib/validations/vehicle";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { checkAndNotifyDueMaintenance } from "@/lib/server/notifications";

const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/odometer">
) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const limited = await enforceRateLimit(
    `odometer-write:${userId}`,
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
  const parsed = odometerUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { reading } = parsed.data;

  if (reading < existing.currentMileage) {
    return Response.json(
      {
        error: {
          reading: [
            `Reading can't be less than the last recorded value (${existing.currentMileage.toLocaleString("en-US")} km).`,
          ],
        },
      },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { currentMileage: reading },
  });

  // Always log, even when the reading is unchanged — this endpoint exists
  // specifically to record "the user checked their odometer today," which
  // resets the update-nudge clock regardless of whether the value moved.
  await prisma.odometerLog.create({
    data: { vehicleId: vehicle.id, reading },
  });

  // Runs after the response is sent so it never adds latency to the save —
  // this is what makes the reminder feel instant instead of waiting for the
  // next daily cron run.
  after(() => checkAndNotifyDueMaintenance(userId, [vehicleId]));

  return Response.json({ vehicle });
}
