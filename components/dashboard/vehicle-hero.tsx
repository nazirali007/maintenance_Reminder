import { FuelIcon, GaugeIcon, Settings2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { getBrandColor } from "@/lib/car-catalog";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicle-labels";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { CarPhoto } from "@/components/vehicles/car-photo";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";
import type { Vehicle } from "@/lib/generated/prisma/client";
import type { MaintenanceStatus } from "@/lib/maintenance";

export function VehicleHero({
  vehicle,
  healthScore,
  healthStatus,
  maintenanceItemCount,
}: {
  vehicle: Vehicle;
  healthScore: number;
  healthStatus: MaintenanceStatus;
  /** The score is an average over tracked items — with none tracked there's nothing to average, so showing 100% would read as "perfect" when it really means "no data". */
  maintenanceItemCount: number;
}) {
  const hasTrackedItems = maintenanceItemCount > 0;
  return (
    <div
      className="relative aspect-video w-full overflow-hidden"
      style={{ backgroundColor: getBrandColor(vehicle.brand) }}
    >
      <CarPhoto
        brand={vehicle.brand}
        model={vehicle.model}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* One row for both, so the badges can't overlay (and swallow clicks on)
          the edit button the way a full-width badge container would. */}
      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <EditVehicleDialog
          vehicle={vehicle}
          maintenanceItemCount={maintenanceItemCount}
          triggerClassName="shrink-0 border-white/40 bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 hover:text-white dark:bg-black/55 dark:hover:bg-black/70"
        />

        <div className="flex flex-wrap justify-end gap-1.5">
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
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandIcon
            brand={vehicle.brand}
            size={36}
            className="shrink-0 ring-2 ring-white/60"
          />
          <p className="min-w-0 truncate text-lg leading-tight font-semibold text-white">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "block text-2xl font-bold text-white drop-shadow",
              hasTrackedItems && healthStatus === "overdue" && "text-destructive",
              hasTrackedItems && healthStatus === "due-soon" && "text-warning",
              hasTrackedItems && healthStatus === "ok" && "text-success",
              !hasTrackedItems && "text-white/60"
            )}
          >
            {hasTrackedItems ? `${healthScore}%` : "—"}
          </span>
          <span className="block text-[10px] font-medium tracking-wide text-white/70 uppercase">
            {hasTrackedItems ? "Service health" : "Not tracked"}
          </span>
        </div>
      </div>
    </div>
  );
}
