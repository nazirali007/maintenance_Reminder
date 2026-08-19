import "server-only";
import { prisma } from "@/lib/server/prisma";
import { getMaintenanceDueInfo, getVehicleServiceDueInfo } from "@/lib/maintenance";
import { sendMaintenanceDueSummaryEmail, type MaintenanceDueEntry } from "@/lib/server/email";
import type { NotificationType, Prisma } from "@/lib/generated/prisma/client";

const ALREADY_SERVICED_HINT =
  " Already had this done? Update the vehicle's last service details in the app to clear this reminder.";

interface Candidate {
  notification: Prisma.NotificationCreateManyInput;
  emailEntry: MaintenanceDueEntry;
  /** Matches the partial unique indexes from the notification_unread_uniqueness migration. */
  dedupKey: string;
}

type DueItemEntry = { item: { id: string }; dueInfo: { status: string } };
type DueVehicleEntry = { vehicle: { id: string }; dueInfo: { status: string } };

function statusToType(status: string): NotificationType {
  return status === "overdue" ? "OVERDUE" : "DUE_SOON";
}

/**
 * Marks unread OVERDUE/DUE_SOON reminders as read once they no longer apply —
 * the user serviced the car, logged the item, or corrected the odometer.
 *
 * Without this, a reminder created while something was overdue stays in the
 * bell forever, even after it's been dealt with. The notification copy itself
 * tells users that updating their service details will "clear this reminder",
 * so not clearing it is a broken promise. Also covers the overdue→due-soon
 * transition: the stale OVERDUE row resolves and a fresh DUE_SOON is created.
 */
async function resolveStaleNotifications(
  userId: string,
  vehicles: { id: string }[],
  dueItems: DueItemEntry[],
  dueVehicles: DueVehicleEntry[]
) {
  const stillDue = new Set([
    ...dueItems.map((d) => `item:${d.item.id}:${statusToType(d.dueInfo.status)}`),
    ...dueVehicles.map((d) => `vehicle:${d.vehicle.id}:${statusToType(d.dueInfo.status)}`),
  ]);

  const openReminders = await prisma.notification.findMany({
    where: {
      userId,
      status: "UNREAD",
      type: { in: ["OVERDUE", "DUE_SOON", "ESTIMATED_OVERDUE"] },
      vehicleId: { in: vehicles.map((v) => v.id) },
    },
    select: { id: true, vehicleId: true, maintenanceItemId: true, type: true },
  });

  const resolvedIds = openReminders
    .filter((n) => {
      // ESTIMATED_OVERDUE comes from the cron's projected mileage; the real
      // reading we're checking against here supersedes it, so it resolves
      // whenever the thing it warned about is no longer due at all.
      const key = n.maintenanceItemId
        ? `item:${n.maintenanceItemId}:`
        : `vehicle:${n.vehicleId}:`;
      if (n.type === "ESTIMATED_OVERDUE") {
        return !stillDue.has(`${key}OVERDUE`) && !stillDue.has(`${key}DUE_SOON`);
      }
      return !stillDue.has(`${key}${n.type}`);
    })
    .map((n) => n.id);

  if (resolvedIds.length === 0) return;

  await prisma.notification.updateMany({
    where: { id: { in: resolvedIds } },
    data: { status: "READ" },
  });
}

/**
 * Checks a user's vehicles against their REAL current mileage/last-service
 * data (as opposed to the daily cron's estimated-from-driving-rate check)
 * and creates OVERDUE/DUE_SOON notifications + sends a digest email for
 * anything newly due. Pass `vehicleIds` to scope it to just-updated
 * vehicles (e.g. right after an odometer update, for an instant reminder)
 * — omit it to check everything, as done on every dashboard load.
 *
 * Skips anything that already has an unread notification of the matching
 * type, so this can be called freely without spamming duplicates: once the
 * user reads (or the item stops being due) a reminder clears, the next
 * check surfaces a fresh one only if it's still relevant. The in-app-check
 * (existing unread?) is only a fast path — two callers can race it (e.g. an
 * odometer update's own check and the dashboard reload it triggers), so the
 * actual dedup guarantee comes from a DB-level partial unique index; we use
 * `createManyAndReturn` + `skipDuplicates` and only email for the rows that
 * really got inserted, never for ones silently dropped as duplicates.
 */
export async function checkAndNotifyDueMaintenance(userId: string, vehicleIds?: string[]) {
  const vehicles = await prisma.vehicle.findMany({
    where: vehicleIds ? { userId, id: { in: vehicleIds } } : { userId },
    include: { maintenanceItems: true, user: { select: { email: true } } },
  });

  if (vehicles.length === 0) return;

  const now = new Date();

  const dueItems = vehicles
    .flatMap((vehicle) =>
      vehicle.maintenanceItems.map((item) => ({
        item,
        vehicle,
        dueInfo: getMaintenanceDueInfo(item, vehicle.currentMileage, { now }),
      }))
    )
    .filter(({ dueInfo }) => dueInfo.status !== "ok");

  const dueVehicles = vehicles
    .map((vehicle) => ({ vehicle, dueInfo: getVehicleServiceDueInfo(vehicle, { now }) }))
    .filter(({ dueInfo }) => dueInfo.status !== "ok");

  await resolveStaleNotifications(userId, vehicles, dueItems, dueVehicles);

  const candidates: Candidate[] = [];

  if (dueItems.length > 0) {
    const existing = await prisma.notification.findMany({
      where: {
        maintenanceItemId: { in: dueItems.map(({ item }) => item.id) },
        type: { in: ["OVERDUE", "DUE_SOON"] },
        status: "UNREAD",
      },
      select: { maintenanceItemId: true, type: true },
    });
    const alreadyNotified = new Set(existing.map((n) => `item:${n.maintenanceItemId}:${n.type}`));

    for (const { item, vehicle, dueInfo } of dueItems) {
      const type: NotificationType = dueInfo.status === "overdue" ? "OVERDUE" : "DUE_SOON";
      const dedupKey = `item:${item.id}:${type}`;
      if (alreadyNotified.has(dedupKey)) continue;

      const vehicleLabel = `${vehicle.brand} ${vehicle.model}`;
      const verb = type === "OVERDUE" ? "is overdue" : "will be due soon";

      candidates.push({
        dedupKey,
        notification: {
          userId,
          vehicleId: vehicle.id,
          maintenanceItemId: item.id,
          type,
          title: type === "OVERDUE" ? `${item.name} is overdue` : `${item.name} due soon`,
          message: `${vehicleLabel} — ${item.name} ${verb}.${ALREADY_SERVICED_HINT}`,
        },
        emailEntry: {
          vehicleLabel,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          itemName: item.name,
          reasonKm: dueInfo.reasonKm,
          reasonDate: dueInfo.reasonDate,
          dueSoon: type === "DUE_SOON",
          isEstimated: false,
        },
      });
    }
  }

  if (dueVehicles.length > 0) {
    const existing = await prisma.notification.findMany({
      where: {
        vehicleId: { in: dueVehicles.map(({ vehicle }) => vehicle.id) },
        maintenanceItemId: null,
        type: { in: ["OVERDUE", "DUE_SOON"] },
        status: "UNREAD",
      },
      select: { vehicleId: true, type: true },
    });
    const alreadyNotified = new Set(existing.map((n) => `vehicle:${n.vehicleId}:${n.type}`));

    for (const { vehicle, dueInfo } of dueVehicles) {
      const type: NotificationType = dueInfo.status === "overdue" ? "OVERDUE" : "DUE_SOON";
      const dedupKey = `vehicle:${vehicle.id}:${type}`;
      if (alreadyNotified.has(dedupKey)) continue;

      const vehicleLabel = `${vehicle.brand} ${vehicle.model}`;
      const verb =
        type === "OVERDUE"
          ? "is overdue for its 10,000 km / annual service"
          : "will be due soon for its 10,000 km / annual service";

      candidates.push({
        dedupKey,
        notification: {
          userId,
          vehicleId: vehicle.id,
          type,
          title: type === "OVERDUE" ? "Service overdue" : "Service due soon",
          message: `${vehicleLabel} ${verb}.${ALREADY_SERVICED_HINT}`,
        },
        emailEntry: {
          vehicleLabel,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          itemName: "Service",
          reasonKm: dueInfo.reasonKm,
          reasonDate: dueInfo.reasonDate,
          dueSoon: type === "DUE_SOON",
          isEstimated: false,
        },
      });
    }
  }

  if (candidates.length === 0) return;

  const created = await prisma.notification.createManyAndReturn({
    data: candidates.map((c) => c.notification),
    skipDuplicates: true,
    select: { maintenanceItemId: true, vehicleId: true, type: true },
  });
  const createdKeys = new Set(
    created.map((n) =>
      n.maintenanceItemId ? `item:${n.maintenanceItemId}:${n.type}` : `vehicle:${n.vehicleId}:${n.type}`
    )
  );

  const emailEntries = candidates
    .filter((c) => createdKeys.has(c.dedupKey))
    .map((c) => c.emailEntry);

  if (emailEntries.length === 0) return;

  try {
    await sendMaintenanceDueSummaryEmail(vehicles[0].user.email, emailEntries);
  } catch (err) {
    console.error("Failed to send instant maintenance-due email:", err);
  }
}

export function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, status: "UNREAD" },
    orderBy: { createdAt: "desc" },
  });
}
