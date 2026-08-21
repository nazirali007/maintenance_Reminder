import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import { checkAndNotifyDueMaintenance } from "@/lib/server/notifications";
import {
  computeHealthScore,
  getHealthScoreStatus,
  getVehicleServiceDueInfo,
  sortByUrgency,
} from "@/lib/maintenance";
import {
  daysBetween,
  estimateDailyRate,
  ODOMETER_NUDGE_THRESHOLD_DAYS,
} from "@/lib/odometer-projection";
import { Card, CardContent } from "@/components/ui/card";
import { AddMaintenanceItemDialog } from "@/components/dashboard/add-maintenance-item-dialog";
import { UpcomingMaintenanceList } from "@/components/dashboard/upcoming-maintenance-list";
import { UpdateOdometerButton } from "@/components/dashboard/update-odometer-button";
import { VehicleServiceAlert } from "@/components/dashboard/vehicle-service-alert";
import { BrandMarquee } from "@/components/dashboard/brand-marquee";
import { VehicleHero } from "@/components/dashboard/vehicle-hero";
import { Greeting } from "@/components/dashboard/greeting";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, vehicles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    }),
    prisma.vehicle.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        maintenanceItems: true,
        odometerLogs: { orderBy: { recordedAt: "desc" }, take: 5 },
      },
    }),
  ]);

  // Runs after the response is sent, so it never adds latency to this render.
  // Anything newly due shows up on the next visit; mutations that change
  // due-status trigger this directly, so it's a safety net for time passing.
  after(() => checkAndNotifyDueMaintenance(session.user!.id!));

  const now = new Date();
  const firstName = user?.name?.trim().split(" ")[0];

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">
          <Greeting />
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t added a vehicle yet.{" "}
          <Link href="/vehicles" className="underline underline-offset-4">
            Add one to get started
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-none flex-1 flex-col gap-6 p-6">
      <h1 className="animate-in fade-in slide-in-from-top-2 text-xl font-semibold duration-500">
        <Greeting />
        {firstName ? `, ${firstName}` : ""} 👋
      </h1>

      <div className="min-w-0 animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:100ms] [animation-fill-mode:both]">
        <BrandMarquee />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {vehicles.map((vehicle, index) => {
          const healthScore = computeHealthScore(vehicle.maintenanceItems, vehicle.currentMileage);
          const healthStatus = getHealthScoreStatus(healthScore);
          const upcomingItems = sortByUrgency(vehicle.maintenanceItems, vehicle.currentMileage, { now });
          const lastOdometerUpdate = vehicle.odometerLogs[0]?.recordedAt ?? vehicle.updatedAt;
          const odometerOverdue =
            daysBetween(lastOdometerUpdate, now) >= ODOMETER_NUDGE_THRESHOLD_DAYS;
          const odometerLogsForRate =
            vehicle.odometerLogs.length > 0
              ? vehicle.odometerLogs
              : [{ reading: vehicle.currentMileage, recordedAt: vehicle.updatedAt }];
          const { kmPerDay } = estimateDailyRate(odometerLogsForRate);
          const serviceDueInfo = getVehicleServiceDueInfo(vehicle, { now, dailyRateKm: kmPerDay });

          return (
            <Card
              key={vehicle.id}
              className="animate-in fade-in slide-in-from-bottom-4 pt-0 transition-shadow duration-500 [animation-fill-mode:both] hover:shadow-lg"
              style={{ animationDelay: `${150 + index * 120}ms` }}
            >
              <VehicleHero
                vehicle={vehicle}
                healthScore={healthScore}
                healthStatus={healthStatus}
                maintenanceItemCount={vehicle.maintenanceItems.length}
              />
              <CardContent className="flex flex-col gap-4">
                <VehicleServiceAlert dueInfo={serviceDueInfo} />

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Upcoming Maintenance</p>
                  <AddMaintenanceItemDialog
                    vehicleId={vehicle.id}
                    currentMileage={vehicle.currentMileage}
                    trackedItems={vehicle.maintenanceItems}
                  />
                </div>

                <UpcomingMaintenanceList
                  vehicleId={vehicle.id}
                  items={upcomingItems}
                  currentMileage={vehicle.currentMileage}
                  dailyRateKm={kmPerDay}
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Odometer:{" "}
                    <span className="font-medium text-foreground">
                      {vehicle.currentMileage.toLocaleString("en-US")} km
                    </span>
                    <span className="text-xs"> · Last service: </span>
                    <span className="text-xs font-medium text-foreground">
                      {vehicle.lastServiceMileage.toLocaleString("en-US")} km
                    </span>
                  </p>
                  <UpdateOdometerButton
                    vehicleId={vehicle.id}
                    currentMileage={vehicle.currentMileage}
                    isOverdue={odometerOverdue}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
