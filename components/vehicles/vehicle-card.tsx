import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { CarPhoto } from "@/components/vehicles/car-photo";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import { FUEL_LABELS } from "@/lib/vehicle-labels";
import type { Vehicle } from "@/lib/generated/prisma/client";

export function VehicleCard({
  vehicle,
}: {
  vehicle: Vehicle & { _count?: { maintenanceItems: number } };
}) {
  const addedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
  }).format(vehicle.createdAt);

  return (
    <Card>
      <CarPhoto brand={vehicle.brand} model={vehicle.model} />
      <CardHeader className="flex items-center gap-3">
        <BrandIcon brand={vehicle.brand} size={40} className="shrink-0" />
        <CardTitle className="min-w-0 flex-1 truncate">
          {vehicle.brand} {vehicle.model}
        </CardTitle>
        <div className="flex shrink-0 items-center gap-1.5">
          <EditVehicleDialog
            vehicle={vehicle}
            maintenanceItemCount={vehicle._count?.maintenanceItems}
          />
          <DeleteVehicleDialog vehicle={vehicle} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {FUEL_LABELS[vehicle.fuelType]}
        </span>
        <p className="text-sm text-muted-foreground">
          {vehicle.currentMileage.toLocaleString("en-US")} km
        </p>
        <p className="text-xs text-muted-foreground">Added {addedDate}</p>
      </CardContent>
    </Card>
  );
}
