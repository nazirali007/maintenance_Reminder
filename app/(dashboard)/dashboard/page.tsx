import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn, getGreeting } from "@/lib/utils";
import { computeHealthScore, getHealthScoreStatus, sortByUrgency } from "@/lib/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMaintenanceItemDialog } from "@/components/dashboard/add-maintenance-item-dialog";
import { MaintenanceItemRow } from "@/components/dashboard/maintenance-item-row";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { CarPhoto } from "@/components/vehicles/car-photo";

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
      include: { maintenanceItems: true },
    }),
  ]);

  const greeting = getGreeting();
  const firstName = user?.name?.trim().split(" ")[0];

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">
          {greeting}
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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">
        {greeting}
        {firstName ? `, ${firstName}` : ""} 👋
      </h1>

      {vehicles.map((vehicle) => {
        const healthScore = computeHealthScore(vehicle.maintenanceItems, vehicle.currentMileage);
        const healthStatus = getHealthScoreStatus(healthScore);
        const upcomingItems = sortByUrgency(vehicle.maintenanceItems, vehicle.currentMileage);

        return (
          <Card key={vehicle.id}>
            <CarPhoto brand={vehicle.brand} model={vehicle.model} />
            <CardHeader className="flex items-center gap-3">
              <BrandIcon brand={vehicle.brand} size={40} />
              <CardTitle className="flex-1">
                {vehicle.brand} {vehicle.model}
              </CardTitle>
              <span
                className={cn(
                  "text-2xl font-semibold",
                  healthStatus === "overdue" && "text-destructive",
                  healthStatus === "due-soon" && "text-warning",
                  healthStatus === "ok" && "text-success"
                )}
              >
                {healthScore}%
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Upcoming Maintenance</p>
                <AddMaintenanceItemDialog
                  vehicleId={vehicle.id}
                  currentMileage={vehicle.currentMileage}
                />
              </div>

              <div className="flex flex-col gap-2">
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No maintenance items tracked yet.
                  </p>
                ) : (
                  upcomingItems.map((item) => (
                    <MaintenanceItemRow
                      key={item.id}
                      vehicleId={vehicle.id}
                      item={item}
                      currentMileage={vehicle.currentMileage}
                    />
                  ))
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Odometer:{" "}
                <span className="font-medium text-foreground">
                  {vehicle.currentMileage.toLocaleString("en-US")} km
                </span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
