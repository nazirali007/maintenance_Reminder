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
      className="relative aspect-video w-full overflow-hidden sm:aspect-[21/9]"
      style={{ backgroundColor: getBrandColor(vehicle.brand) }}
    >
      <CarPhoto
        brand={vehicle.brand}
        model={vehicle.model}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute top-3 right-3 flex flex-col gap-2 rounded-xl bg-black/50 p-3 text-xs font-medium text-white backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <FuelIcon size={14} /> {FUEL_LABELS[vehicle.fuelType]}
        </span>
        <span className="flex items-center gap-1.5">
          <GaugeIcon size={14} /> {vehicle.currentMileage.toLocaleString("en-US")} km
        </span>
        <span className="flex items-center gap-1.5">
          <Settings2Icon size={14} /> {TRANSMISSION_LABELS[vehicle.transmission]}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <BrandIcon brand={vehicle.brand} size={36} className="ring-2 ring-white/60" />
          <div>
            <p className="text-[10px] font-medium tracking-wide text-white/70 uppercase">
              Your Vehicle
            </p>
            <p className="text-lg leading-tight font-semibold text-white">
              {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-2xl font-bold text-white drop-shadow",
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
