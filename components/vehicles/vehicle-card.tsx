import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader>
        <CardTitle>
          {vehicle.brand} {vehicle.model}
        </CardTitle>
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
