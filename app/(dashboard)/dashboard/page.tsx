import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn, getGreeting } from "@/lib/utils";
import { computeHealthScore, getHealthScoreStatus, sortByUrgency } from "@/lib/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMaintenanceItemDialog } from "@/components/dashboard/add-maintenance-item-dialog";
import { MaintenanceItemRow } from "@/components/dashboard/maintenance-item-row";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { maintenanceItems: true },
  });

  const greeting = getGreeting();

  if (!vehicle) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">{greeting} 👋</h1>
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

  const healthScore = computeHealthScore(vehicle.maintenanceItems, vehicle.currentMileage);
  const healthStatus = getHealthScoreStatus(healthScore);
  const upcomingItems = sortByUrgency(vehicle.maintenanceItems, vehicle.currentMileage);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">{greeting} 👋</h1>
        <p className="text-sm text-muted-foreground">
          {vehicle.brand} {vehicle.model}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Car Health</CardTitle>
        </CardHeader>
        <CardContent>
          <span
            className={cn(
              "text-4xl font-semibold",
              healthStatus === "overdue" && "text-destructive",
              healthStatus === "due-soon" && "text-warning",
              healthStatus === "ok" && "text-success"
            )}
          >
            {healthScore}%
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Upcoming Maintenance</CardTitle>
          <AddMaintenanceItemDialog
            vehicleId={vehicle.id}
            currentMileage={vehicle.currentMileage}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No maintenance items tracked yet.
            </p>
          ) : (
            upcomingItems.map((item) => (
              <MaintenanceItemRow
                key={item.id}
                item={item}
                currentMileage={vehicle.currentMileage}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Odometer</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">
            {vehicle.currentMileage.toLocaleString("en-US")} km
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
