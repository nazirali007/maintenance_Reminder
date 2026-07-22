import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations/vehicle";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ vehicles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  const vehicle = await prisma.vehicle.create({
    data: {
      ...rest,
      variant: variant || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      userId: session.user.id,
    },
  });

  return Response.json({ vehicle }, { status: 201 });
}
