import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceItemSchema } from "@/lib/validations/maintenance";

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
  const parsed = maintenanceItemSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const maintenanceItem = await prisma.maintenanceItem.create({
    data: {
      ...parsed.data,
      vehicleId,
    },
  });

  return Response.json({ maintenanceItem }, { status: 201 });
}
