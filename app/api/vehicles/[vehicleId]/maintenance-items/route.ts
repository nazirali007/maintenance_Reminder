import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceChecklistSchema } from "@/lib/validations/maintenance";

const GENERAL_NOTE_INTERVAL_KM = 200000;

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]/maintenance-items">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await ctx.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle || vehicle.userId !== session.user.id) {
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

  const { lastServiceMileage, notes, items } = parsed.data;
  const trimmedNotes = notes?.trim() || null;

  const rowsToCreate =
    items.length > 0
      ? items.map((item) => ({
          name: item.name,
          intervalKm: item.intervalKm,
          lastServiceMileage,
          notes: trimmedNotes,
          vehicleId,
        }))
      : [
          {
            name: "General Note",
            intervalKm: GENERAL_NOTE_INTERVAL_KM,
            lastServiceMileage,
            notes: trimmedNotes,
            vehicleId,
          },
        ];

  const maintenanceItems = await prisma.$transaction(
    rowsToCreate.map((data) => prisma.maintenanceItem.create({ data }))
  );

  return Response.json({ maintenanceItems }, { status: 201 });
}
