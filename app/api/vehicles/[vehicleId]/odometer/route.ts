import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { odometerUpdateSchema } from "@/lib/validations/vehicle";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/odometer">
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

  return Response.json({ vehicle });
}
