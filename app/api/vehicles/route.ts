import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { vehicleSchema } from "@/lib/validations/vehicle";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ vehicles });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { variant, purchaseDate, lastServiceDate, ...rest } = parsed.data;

  const vehicle = await prisma.vehicle.create({
    data: {
      ...rest,
      variant: variant || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
      userId,
    },
  });

  await prisma.odometerLog.create({
    data: {
      vehicleId: vehicle.id,
      reading: vehicle.currentMileage,
      recordedAt: vehicle.createdAt,
    },
  });

  return Response.json({ vehicle }, { status: 201 });
}
