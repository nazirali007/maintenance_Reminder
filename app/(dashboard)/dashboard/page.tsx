import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cn, getGreeting } from "@/lib/utils";
import { computeHealthScore, getHealthScoreStatus, sortByUrgency } from "@/lib/maintenance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddMaintenanceItemDialog } from "@/components/dashboard/add-maintenance-item-dialog";
import { UpcomingMaintenanceList } from "@/components/dashboard/upcoming-maintenance-list";
import { BrandMarquee } from "@/components/dashboard/brand-marquee";
import { VehicleHero } from "@/components/dashboard/vehicle-hero";
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
      <h1 className="animate-in fade-in slide-in-from-top-2 text-xl font-semibold duration-500">
        {greeting}
        {firstName ? `, ${firstName}` : ""} 👋
      </h1>

      <div className="animate-in fade-in slide-in-from-top-2 duration-500 [animation-delay:100ms] [animation-fill-mode:both]">
        <BrandMarquee />
      </div>

      {vehicles.map((vehicle, index) => {
        const healthScore = computeHealthScore(vehicle.maintenanceItems, vehicle.currentMileage);
        const healthStatus = getHealthScoreStatus(healthScore);
        const upcomingItems = sortByUrgency(vehicle.maintenanceItems, vehicle.currentMileage);

        return (
          <Card
            key={vehicle.id}
            className={cn(
              "animate-in fade-in slide-in-from-bottom-4 transition-shadow duration-500 [animation-fill-mode:both] hover:shadow-lg",
              index === 0 && "pt-0"
            )}
            style={{ animationDelay: `${150 + index * 120}ms` }}
          >
            {index === 0 ? (
              <VehicleHero
                vehicle={vehicle}
                healthScore={healthScore}
                healthStatus={healthStatus}
              />
            ) : (
              <>
                <CarPhoto brand={vehicle.brand} model={vehicle.model} />
                <CardHeader className="flex items-center gap-3">
                  <BrandIcon brand={vehicle.brand} size={40} />
                  <CardTitle className="flex-1">
                    {vehicle.brand} {vehicle.model}
                  </CardTitle>
                  <span
                    className={cn(
                      "text-2xl font-semibold transition-transform duration-300 hover:scale-110",
                      healthStatus === "overdue" && "text-destructive",
                      healthStatus === "due-soon" && "text-warning",
                      healthStatus === "ok" && "text-success"
                    )}
                  >
                    {healthScore}%
                  </span>
                </CardHeader>
              </>
            )}
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Upcoming Maintenance</p>
                <AddMaintenanceItemDialog
                  vehicleId={vehicle.id}
                  currentMileage={vehicle.currentMileage}
                />
              </div>

              <UpcomingMaintenanceList
                vehicleId={vehicle.id}
                items={upcomingItems}
                currentMileage={vehicle.currentMileage}
              />

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
