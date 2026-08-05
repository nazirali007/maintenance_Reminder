import "server-only";
import { prisma } from "@/lib/server/prisma";
import { getMaintenanceDueInfo, getVehicleServiceDueInfo } from "@/lib/maintenance";

/**
 * Creates an OVERDUE notification for each maintenance item — and separately
 * for each vehicle's blanket 10,000km/1-year service rule — that has become
 * overdue, skipping anything that already has an unread OVERDUE notification
 * so this can be called on every dashboard load without spamming duplicates.
 *
 * Batches the dedup checks and inserts into a fixed number of queries
 * regardless of how many vehicles/items a user has, instead of one query per
 * overdue item.
 */
export async function syncOverdueNotifications(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { maintenanceItems: true },
  });

  const overdueItems = vehicles.flatMap((vehicle) =>
    vehicle.maintenanceItems
      .filter((item) => getMaintenanceDueInfo(item, vehicle.currentMileage).isOverdue)
      .map((item) => ({ item, vehicle }))
  );

  if (overdueItems.length > 0) {
    const existing = await prisma.notification.findMany({
      where: {
        maintenanceItemId: { in: overdueItems.map(({ item }) => item.id) },
        type: "OVERDUE",
        status: "UNREAD",
      },
      select: { maintenanceItemId: true },
    });
    const alreadyNotified = new Set(existing.map((n) => n.maintenanceItemId));

    const toCreate = overdueItems.filter(({ item }) => !alreadyNotified.has(item.id));
    if (toCreate.length > 0) {
      await prisma.notification.createMany({
        data: toCreate.map(({ item, vehicle }) => ({
          userId,
          type: "OVERDUE" as const,
          title: `${item.name} is overdue`,
          message: `${vehicle.brand} ${vehicle.model} — ${item.name} is now overdue.`,
          maintenanceItemId: item.id,
        })),
      });
    }
  }

  const overdueVehicles = vehicles.filter(
    (vehicle) => getVehicleServiceDueInfo(vehicle).isOverdue
  );

  if (overdueVehicles.length > 0) {
    const existing = await prisma.notification.findMany({
      where: {
        vehicleId: { in: overdueVehicles.map((vehicle) => vehicle.id) },
        maintenanceItemId: null,
        type: "OVERDUE",
        status: "UNREAD",
      },
      select: { vehicleId: true },
    });
    const alreadyNotified = new Set(existing.map((n) => n.vehicleId));

    const toCreate = overdueVehicles.filter((vehicle) => !alreadyNotified.has(vehicle.id));
    if (toCreate.length > 0) {
      await prisma.notification.createMany({
        data: toCreate.map((vehicle) => ({
          userId,
          vehicleId: vehicle.id,
          type: "OVERDUE" as const,
          title: "Service overdue",
          message: `${vehicle.brand} ${vehicle.model} is overdue for its 10,000 km / annual service.`,
        })),
      });
    }
  }
}

export function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, status: "UNREAD" },
    orderBy: { createdAt: "desc" },
  });
}
