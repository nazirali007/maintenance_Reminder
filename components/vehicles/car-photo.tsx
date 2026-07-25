"use client";

import { useState } from "react";

import { getModelImagePath } from "@/lib/car-catalog";
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
  const imagePath = getModelImagePath(brand, model);

  if (!imagePath || failed) {
    return null;
  }

  return (
    <img
      src={imagePath}
      alt={`${brand} ${model}`}
      className={cn("aspect-video w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
