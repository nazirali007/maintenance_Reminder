"use client";

import { useState } from "react";

import { findBrand, getCarPhotoPath } from "@/lib/car-catalog";
import { cn } from "@/lib/utils";

export function CarPhoto({
  brand,
  model,
  className,
}: {
  brand: string;
  model: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const brandData = findBrand(brand);

  if (!brandData || failed) {
    return null;
  }

  return (
    <img
      src={getCarPhotoPath(brandData.id, model)}
      alt={`${brand} ${model}`}
      className={cn("aspect-video w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
