"use client";

import { useState } from "react";
import { CarIcon } from "lucide-react";

import { findBrand, getBrandColor, getBrandLogoPath } from "@/lib/car-catalog";
import { cn } from "@/lib/utils";

export function BrandIcon({
  brand,
  size = 32,
  className,
}: {
  brand: string;
  size?: number;
  className?: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const brandData = findBrand(brand);

  if (brandData && !logoFailed) {
    return (
      <img
        src={getBrandLogoPath(brandData.id)}
        alt={brand}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-md object-contain", className)}
        style={{ width: size, height: size }}
        onError={() => setLogoFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white",
        className
      )}
      style={{
        backgroundColor: getBrandColor(brand),
        width: size,
        height: size,
      }}
    >
      <CarIcon size={size * 0.55} strokeWidth={2} />
    </div>
  );
}
