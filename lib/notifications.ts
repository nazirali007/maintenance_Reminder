import { prisma } from "@/lib/prisma";
import { getMaintenanceDueInfo } from "@/lib/maintenance";

/**
 * Creates an OVERDUE notification for each maintenance item that has become
 * overdue, skipping items that already have an unread OVERDUE notification
 * so this can be called on every dashboard load without spamming duplicates.
 */
export async function syncOverdueNotifications(userId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId },
    include: { maintenanceItems: true },
  });

  for (const vehicle of vehicles) {
    for (const item of vehicle.maintenanceItems) {
      const { isOverdue } = getMaintenanceDueInfo(item, vehicle.currentMileage);
      if (!isOverdue) continue;

      const existing = await prisma.notification.findFirst({
        where: {
          maintenanceItemId: item.id,
          type: "OVERDUE",
          status: "UNREAD",
        },
      });

      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId,
          type: "OVERDUE",
          title: `${item.name} is overdue`,
          message: `${vehicle.brand} ${vehicle.model} — ${item.name} is now overdue.`,
          maintenanceItemId: item.id,
        },
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
