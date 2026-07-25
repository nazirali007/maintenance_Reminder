"use client";

import { useWatch, type Control } from "react-hook-form";

import type { VehicleInput } from "@/lib/validations/vehicle";
import { CarPhoto } from "@/components/vehicles/car-photo";
import { BrandIcon } from "@/components/vehicles/brand-icon";

export function VehiclePhotoPreview({ control }: { control: Control<VehicleInput> }) {
  const brand = useWatch({ control, name: "brand" });
  const model = useWatch({ control, name: "model" });

  if (!brand || !model) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <CarPhoto
        brand={brand}
        model={model}
        className="h-64 w-full rounded-lg border border-border bg-muted object-contain p-2"
      />
      <div className="flex items-center gap-2">
        <BrandIcon brand={brand} size={24} />
        <p className="text-sm font-medium">
          {brand} {model}
        </p>
      </div>
    </div>
  );
}
