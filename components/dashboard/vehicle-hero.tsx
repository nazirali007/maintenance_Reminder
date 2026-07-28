import { FuelIcon, GaugeIcon, Settings2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { getBrandColor } from "@/lib/car-catalog";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicle-labels";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { CarPhoto } from "@/components/vehicles/car-photo";
import type { Vehicle } from "@/lib/generated/prisma/client";
import type { MaintenanceStatus } from "@/lib/maintenance";

export function VehicleHero({
  vehicle,
  healthScore,
  healthStatus,
}: {
  vehicle: Vehicle;
  healthScore: number;
  healthStatus: MaintenanceStatus;
}) {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]"
      style={{ backgroundColor: getBrandColor(vehicle.brand) }}
    >
      <CarPhoto
        brand={vehicle.brand}
        model={vehicle.model}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute inset-x-3 top-3 flex flex-wrap justify-end gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
          <FuelIcon size={12} /> {FUEL_LABELS[vehicle.fuelType]}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
          <GaugeIcon size={12} /> {vehicle.currentMileage.toLocaleString("en-US")} km
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium whitespace-nowrap text-white backdrop-blur-sm">
          <Settings2Icon size={12} /> {TRANSMISSION_LABELS[vehicle.transmission]}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandIcon
            brand={vehicle.brand}
            size={36}
            className="shrink-0 ring-2 ring-white/60"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-wide text-white/70 uppercase">
              Your Vehicle
            </p>
            <p className="truncate text-lg leading-tight font-semibold text-white">
              {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 text-2xl font-bold text-white drop-shadow",
            healthStatus === "overdue" && "text-destructive",
            healthStatus === "due-soon" && "text-warning",
            healthStatus === "ok" && "text-success"
          )}
        >
          {healthScore}%
        </span>
      </div>
    </div>
  );
}
