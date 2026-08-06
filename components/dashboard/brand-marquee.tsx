"use client";

import { useState } from "react";

import { CAR_BRANDS } from "@/lib/car-catalog";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { AddVehicleDialog } from "@/components/vehicles/add-vehicle-dialog";

export function BrandMarquee() {
  const brands = [...CAR_BRANDS, ...CAR_BRANDS];
  const [open, setOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>();

  return (
    <>
      <div
        className="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        style={{ perspective: "800px" }}
      >
        <div className="animate-marquee flex w-max items-center gap-8 px-4">
          {brands.map((brand, index) => (
            <button
              key={`${brand.id}-${index}`}
              type="button"
              onClick={() => {
                setSelectedBrand(brand.name);
                setOpen(true);
              }}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5 transition-transform duration-300 ease-out will-change-transform hover:[transform:translateY(-4px)_rotateY(18deg)_scale(1.12)]"
            >
              <BrandIcon brand={brand.name} size={36} eager />
              <span className="text-[10px] font-medium text-muted-foreground">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AddVehicleDialog open={open} onOpenChange={setOpen} defaultBrand={selectedBrand} />
    </>
  );
}
