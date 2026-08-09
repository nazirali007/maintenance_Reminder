import "server-only";
import { prisma } from "@/lib/server/prisma";
import {
  projectCurrentMileage,
  ODOMETER_NUDGE_THRESHOLD_DAYS,
  type OdometerLogLike,
} from "@/lib/odometer-projection";
import {
  DUE_SOON_KM_THRESHOLD,
  DUE_SOON_DAYS,
  VEHICLE_SERVICE_INTERVAL_KM,
  VEHICLE_SERVICE_DUE_SOON_KM,
} from "@/lib/maintenance";
import {
  sendMaintenanceDueSummaryEmail,
  sendOdometerUpdateNudgeEmail,
  type MaintenanceDueEntry,
} from "@/lib/server/email";

const RENOTIFY_WINDOW_DAYS = 7;
const NUDGE_THRESHOLD_DAYS = ODOMETER_NUDGE_THRESHOLD_DAYS;
const NUDGE_WINDOW_DAYS = ODOMETER_NUDGE_THRESHOLD_DAYS;
const ONE_YEAR_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CronSummary {
  vehiclesChecked: number;
  remindersCreated: number;
  nudgesCreated: number;
  emailsSent: number;
  emailFailures: number;
  errors: { id: string; error: string }[];
}

function daysSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / MS_PER_DAY;
}

export async function runDailyMaintenanceCheck(
  options: { dryRun?: boolean } = {}
): Promise<CronSummary> {
  const dryRun = options.dryRun ?? false;
  const now = new Date();

  const summary: CronSummary = {
    vehiclesChecked: 0,
    remindersCreated: 0,
    nudgesCreated: 0,
    emailsSent: 0,
    emailFailures: 0,
    errors: [],
  };

  const vehicles = await prisma.vehicle.findMany({
    include: {
      user: true,
      maintenanceItems: true,
      odometerLogs: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
  });

  // Collect due-item entries per user across every vehicle in this run, so
  // each user gets a single digest email instead of one email per item.
  const dueEntriesByUser = new Map<string, { email: string; entries: MaintenanceDueEntry[] }>();

  function queueDueEntry(userId: string, email: string, entry: MaintenanceDueEntry) {
    const queued = dueEntriesByUser.get(userId);
    if (queued) {
      queued.entries.push(entry);
    } else {
      dueEntriesByUser.set(userId, { email, entries: [entry] });
    }
  }

  for (const vehicle of vehicles) {
    summary.vehiclesChecked += 1;

    try {
      const logs: OdometerLogLike[] =
        vehicle.odometerLogs.length > 0
          ? vehicle.odometerLogs
          : [{ reading: vehicle.currentMileage, recordedAt: vehicle.updatedAt }];

      const estimatedMileage = projectCurrentMileage(logs, now);
      const vehicleLabel = `${vehicle.brand} ${vehicle.model}`;

      for (const item of vehicle.maintenanceItems) {
        const remainingKm = item.lastServiceMileage + item.intervalKm - estimatedMileage;
        const kmDue = remainingKm <= 0;
        const kmDueSoon = !kmDue && remainingKm <= DUE_SOON_KM_THRESHOLD;

        const daysSinceService =
          item.lastServiceDate != null ? daysSince(item.lastServiceDate, now) : null;
        const dateDue = daysSinceService != null && daysSinceService >= ONE_YEAR_DAYS;
        const dateDueSoon =
          !dateDue &&
          daysSinceService != null &&
          daysSinceService >= ONE_YEAR_DAYS - DUE_SOON_DAYS;

        const isDue = kmDue || dateDue;
        const isDueSoon = !isDue && (kmDueSoon || dateDueSoon);

        if (!isDue && !isDueSoon) continue;

        const recentWindow = new Date(now.getTime() - RENOTIFY_WINDOW_DAYS * MS_PER_DAY);
        const existing = await prisma.notification.findFirst({
          where: {
            maintenanceItemId: item.id,
            type: isDue ? { in: ["OVERDUE", "ESTIMATED_OVERDUE"] } : "DUE_SOON",
            createdAt: { gte: recentWindow },
          },
        });
        if (existing) continue;

        summary.remindersCreated += 1;

        if (dryRun) continue;

        await prisma.notification.create({
          data: {
            userId: vehicle.userId,
            vehicleId: vehicle.id,
            maintenanceItemId: item.id,
            type: isDue ? "ESTIMATED_OVERDUE" : "DUE_SOON",
            title: isDue ? `${item.name} may be due` : `${item.name} due soon`,
            message: isDue
              ? `${vehicleLabel} — ${item.name} may be due for service (estimated).`
              : `${vehicleLabel} — ${item.name} will likely be due for service soon (estimated).`,
          },
        });

        queueDueEntry(vehicle.userId, vehicle.user.email, {
          vehicleLabel,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          itemName: item.name,
          reasonKm: kmDue || kmDueSoon,
          reasonDate: dateDue || dateDueSoon,
          dueSoon: isDueSoon,
        });
      }

      // The blanket whole-car rule, separate from per-item tracking above:
      // 10,000km or 1 year since the car itself was last serviced.
      const vehicleRemainingKm =
        vehicle.lastServiceMileage + VEHICLE_SERVICE_INTERVAL_KM - estimatedMileage;
      const vehicleKmDue = vehicleRemainingKm <= 0;
      const vehicleKmDueSoon =
        !vehicleKmDue && vehicleRemainingKm <= VEHICLE_SERVICE_DUE_SOON_KM;

      const daysSinceVehicleService =
        vehicle.lastServiceDate != null
          ? daysSince(vehicle.lastServiceDate, now)
          : null;
      const vehicleDateDue =
        daysSinceVehicleService != null && daysSinceVehicleService >= ONE_YEAR_DAYS;
      const vehicleDateDueSoon =
        !vehicleDateDue &&
        daysSinceVehicleService != null &&
        daysSinceVehicleService >= ONE_YEAR_DAYS - DUE_SOON_DAYS;

      const vehicleIsDue = vehicleKmDue || vehicleDateDue;
      const vehicleIsDueSoon = !vehicleIsDue && (vehicleKmDueSoon || vehicleDateDueSoon);

      if (vehicleIsDue || vehicleIsDueSoon) {
        const recentWindow = new Date(now.getTime() - RENOTIFY_WINDOW_DAYS * MS_PER_DAY);
        const existingVehicleReminder = await prisma.notification.findFirst({
          where: {
            vehicleId: vehicle.id,
            maintenanceItemId: null,
            type: vehicleIsDue ? { in: ["OVERDUE", "ESTIMATED_OVERDUE"] } : "DUE_SOON",
            createdAt: { gte: recentWindow },
          },
        });

        if (!existingVehicleReminder) {
          summary.remindersCreated += 1;

          if (!dryRun) {
            await prisma.notification.create({
              data: {
                userId: vehicle.userId,
                vehicleId: vehicle.id,
                type: vehicleIsDue ? "ESTIMATED_OVERDUE" : "DUE_SOON",
                title: vehicleIsDue ? "Service may be due" : "Service due soon",
                message: vehicleIsDue
                  ? `${vehicleLabel} may be due for its 10,000 km / annual service (estimated).`
                  : `${vehicleLabel} will likely be due for its 10,000 km / annual service soon (estimated).`,
              },
            });

            queueDueEntry(vehicle.userId, vehicle.user.email, {
              vehicleLabel,
              vehicleBrand: vehicle.brand,
              vehicleModel: vehicle.model,
              itemName: "Service",
              reasonKm: vehicleKmDue || vehicleKmDueSoon,
              reasonDate: vehicleDateDue || vehicleDateDueSoon,
              dueSoon: vehicleIsDueSoon,
            });
          }
        }
      }

      const lastLog = logs[0];
      const daysSinceLog = daysSince(lastLog.recordedAt, now);

      if (daysSinceLog >= NUDGE_THRESHOLD_DAYS) {
        const nudgeWindow = new Date(now.getTime() - NUDGE_WINDOW_DAYS * MS_PER_DAY);
        const existingNudge = await prisma.notification.findFirst({
          where: {
            vehicleId: vehicle.id,
            type: "ODOMETER_UPDATE_NUDGE",
            createdAt: { gte: nudgeWindow },
          },
        });

        if (!existingNudge) {
          summary.nudgesCreated += 1;

          if (!dryRun) {
            await prisma.notification.create({
              data: {
                userId: vehicle.userId,
                vehicleId: vehicle.id,
                type: "ODOMETER_UPDATE_NUDGE",
                title: "Update your odometer",
                message: `Please update the odometer for ${vehicleLabel} — it's been ${Math.round(daysSinceLog)} days.`,
              },
            });

            try {
              await sendOdometerUpdateNudgeEmail(vehicle.user.email, {
                vehicleLabel,
                vehicleBrand: vehicle.brand,
                vehicleModel: vehicle.model,
                daysSinceLastUpdate: Math.round(daysSinceLog),
              });
              summary.emailsSent += 1;
            } catch (err) {
              summary.emailFailures += 1;
              summary.errors.push({
                id: vehicle.id,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }
      }
    } catch (err) {
      summary.errors.push({
        id: vehicle.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  for (const [userId, { email, entries }] of dueEntriesByUser) {
    try {
      await sendMaintenanceDueSummaryEmail(email, entries);
      summary.emailsSent += 1;
    } catch (err) {
      summary.emailFailures += 1;
      summary.errors.push({
        id: userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}
