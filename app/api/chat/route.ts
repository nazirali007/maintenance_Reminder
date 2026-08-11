import { prisma } from "@/lib/server/prisma";
import { requireUserId, unauthorizedResponse } from "@/lib/server/auth-guard";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { chatRequestSchema } from "@/lib/validations/chat";
import { generateChatReply } from "@/lib/server/gemini";
import { getMaintenanceDueInfo, getVehicleServiceDueInfo } from "@/lib/maintenance";
import { withApiErrorHandling } from "@/lib/server/api-error";
import type { Vehicle, MaintenanceItem } from "@/lib/generated/prisma/client";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function buildVehicleContext(
  vehicles: (Vehicle & { maintenanceItems: MaintenanceItem[] })[]
): string {
  if (vehicles.length === 0) {
    return "The signed-in user hasn't added any vehicles yet — encourage them to add one in the app if relevant.";
  }

  const now = new Date();

  const sections = vehicles.map((vehicle) => {
    const overall = getVehicleServiceDueInfo(vehicle, { now });
    const itemLines =
      vehicle.maintenanceItems.length > 0
        ? vehicle.maintenanceItems
            .map((item) => {
              const info = getMaintenanceDueInfo(item, vehicle.currentMileage, { now });
              return `    - ${item.name}: ${info.label} (status: ${info.status})`;
            })
            .join("\n")
        : "    (no maintenance items tracked yet)";

    return [
      `- ${vehicle.brand} ${vehicle.model} (${vehicle.fuelType}, ${vehicle.transmission})`,
      `  Odometer: ${vehicle.currentMileage.toLocaleString("en-US")} km. Last service: ${vehicle.lastServiceMileage.toLocaleString("en-US")} km${
        vehicle.lastServiceDate ? ` on ${vehicle.lastServiceDate.toDateString()}` : ""
      }.`,
      `  Overall service status: ${overall.label} (status: ${overall.status}).`,
      `  Tracked maintenance items:`,
      itemLines,
    ].join("\n");
  });

  return `The signed-in user's vehicles:\n${sections.join("\n\n")}`;
}

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const userId = await requireUserId();
    if (!userId) return unauthorizedResponse();

    const limited = await enforceRateLimit(`chat:${userId}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (limited) return limited;

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message, history = [] } = parsed.data;

    const [user, vehicles] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.vehicle.findMany({ where: { userId }, include: { maintenanceItems: true } }),
    ]);
    const firstName = user?.name?.trim().split(" ")[0];

    try {
      const reply = await generateChatReply({
        message,
        history,
        vehicleContext: buildVehicleContext(vehicles),
        userName: firstName,
      });

      return Response.json({ reply });
    } catch (err) {
      console.error("Chat generation failed:", err);
      return Response.json(
        { error: "Something went wrong talking to the assistant. Please try again." },
        { status: 502 }
      );
    }
  });
}
