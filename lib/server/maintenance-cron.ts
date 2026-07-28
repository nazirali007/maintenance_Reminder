import "server-only";
import { prisma } from "@/lib/server/prisma";
import { projectCurrentMileage, type OdometerLogLike } from "@/lib/odometer-projection";
import { sendMaintenanceDueEmail, sendOdometerUpdateNudgeEmail } from "@/lib/server/email";

const RENOTIFY_WINDOW_DAYS = 7;
const NUDGE_THRESHOLD_DAYS = 15;
const NUDGE_WINDOW_DAYS = 15;
const ONE_YEAR_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CronSummary {
  vehiclesChecked: number;
  estimatedOverdueCreated: number;
  nudgesCreated: number;
  emailsSent: number;
  emailFailures: number;
  errors: { vehicleId: string; error: string }[];
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
    estimatedOverdueCreated: 0,
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
        const kmDue = estimatedMileage - item.lastServiceMileage >= item.intervalKm;
        const dateDue =
          item.lastServiceDate != null &&
          daysSince(item.lastServiceDate, now) >= ONE_YEAR_DAYS;

        if (!kmDue && !dateDue) continue;

        const recentWindow = new Date(now.getTime() - RENOTIFY_WINDOW_DAYS * MS_PER_DAY);
        const existing = await prisma.notification.findFirst({
          where: {
            maintenanceItemId: item.id,
            type: { in: ["OVERDUE", "ESTIMATED_OVERDUE"] },
            createdAt: { gte: recentWindow },
          },
        });
        if (existing) continue;

        summary.estimatedOverdueCreated += 1;

        if (dryRun) continue;

        await prisma.notification.create({
          data: {
            userId: vehicle.userId,
            vehicleId: vehicle.id,
            maintenanceItemId: item.id,
            type: "ESTIMATED_OVERDUE",
            title: `${item.name} may be due`,
            message: `${vehicleLabel} — ${item.name} may be due for service (estimated).`,
          },
        });

        try {
          await sendMaintenanceDueEmail(vehicle.user.email, {
            vehicleLabel,
            itemName: item.name,
            reasonKm: kmDue,
            reasonDate: dateDue,
          });
          summary.emailsSent += 1;
        } catch (err) {
          summary.emailFailures += 1;
          summary.errors.push({
            vehicleId: vehicle.id,
            error: err instanceof Error ? err.message : String(err),
          });
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
                daysSinceLastUpdate: Math.round(daysSinceLog),
              });
              summary.emailsSent += 1;
            } catch (err) {
              summary.emailFailures += 1;
              summary.errors.push({
                vehicleId: vehicle.id,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }
      }
    } catch (err) {
      summary.errors.push({
        vehicleId: vehicle.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}
