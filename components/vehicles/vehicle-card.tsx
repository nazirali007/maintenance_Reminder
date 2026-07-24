import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { CarPhoto } from "@/components/vehicles/car-photo";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";
import type { Vehicle } from "@/lib/generated/prisma/client";

const FUEL_LABELS: Record<Vehicle["fuelType"], string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  CNG: "CNG",
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const addedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
  }).format(vehicle.createdAt);

  return (
    <Card>
      <CarPhoto brand={vehicle.brand} model={vehicle.model} />
      <CardHeader className="flex items-center gap-3">
        <BrandIcon brand={vehicle.brand} size={40} />
        <CardTitle className="flex-1">
          {vehicle.brand} {vehicle.model}
        </CardTitle>
        <EditVehicleDialog vehicle={vehicle} />
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
