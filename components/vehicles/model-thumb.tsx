"use client";

import { useState } from "react";
import { CarIcon } from "lucide-react";

import { getBrandColor, getCarPhotoPath } from "@/lib/car-catalog";
import { cn } from "@/lib/utils";

export function ModelThumb({
  brandId,
  brandName,
  model,
  size = 28,
  className,
}: {
  brandId: string;
  brandName: string;
  model: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={getCarPhotoPath(brandId, model)}
        alt={`${brandName} ${model}`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-md object-cover", className)}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md text-white",
        className
      )}
      style={{
        backgroundColor: getBrandColor(brandName),
        width: size,
        height: size,
      }}
    >
      <CarIcon size={size * 0.5} strokeWidth={2} />
    </div>
  );
}
