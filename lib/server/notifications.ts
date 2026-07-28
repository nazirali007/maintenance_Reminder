import "server-only";
import { prisma } from "@/lib/server/prisma";
import { getMaintenanceDueInfo } from "@/lib/maintenance";

/**
 * Creates an OVERDUE notification for each maintenance item that has become
 * overdue, skipping items that already have an unread OVERDUE notification
 * so this can be called on every dashboard load without spamming duplicates.
 *
 * Batches the dedup check and the inserts into a fixed number of queries
 * regardless of how many vehicles/items a user has, instead of one query per
 * overdue item.
 */
export async function syncOverdueNotifications(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { maintenanceItems: true },
  });

  const overdue = vehicles.flatMap((vehicle) =>
    vehicle.maintenanceItems
      .filter((item) => getMaintenanceDueInfo(item, vehicle.currentMileage).isOverdue)
      .map((item) => ({ item, vehicle }))
  );

  if (overdue.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: {
      maintenanceItemId: { in: overdue.map(({ item }) => item.id) },
      type: "OVERDUE",
      status: "UNREAD",
    },
    select: { maintenanceItemId: true },
  });
  const alreadyNotified = new Set(existing.map((n) => n.maintenanceItemId));

  const toCreate = overdue.filter(({ item }) => !alreadyNotified.has(item.id));
  if (toCreate.length === 0) return;

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

export function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, status: "UNREAD" },
    orderBy: { createdAt: "desc" },
  });
}
