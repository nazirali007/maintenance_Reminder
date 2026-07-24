import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations/vehicle";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/vehicles/[vehicleId]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await ctx.params;

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!existing || existing.userId !== session.user.id) {
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

  return Response.json({ vehicle });
}
