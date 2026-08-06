import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const WRITE_RATE_LIMIT = 20;
const WRITE_RATE_WINDOW_MS = 60 * 1000; // 1 minute

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

  const limited = await enforceRateLimit(
    `vehicles-write:${userId}`,
    WRITE_RATE_LIMIT,
    WRITE_RATE_WINDOW_MS
  );
  if (limited) return limited;

  const body = await request.json();
  const parsed = vehicleSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { lastServiceDate, ...rest } = parsed.data;

  const vehicle = await prisma.vehicle.create({
    data: {
      ...rest,
      year: new Date().getFullYear(),
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
