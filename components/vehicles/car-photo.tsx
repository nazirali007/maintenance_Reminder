"use client";

import { useState } from "react";
import Image from "next/image";

import { getModelImagePath } from "@/lib/car-catalog";
import { cn } from "@/lib/utils";

export function CarPhoto({
  brand,
  model,
  className,
  fill = false,
}: {
  brand: string;
  model: string;
  className?: string;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imagePath = getModelImagePath(brand, model);

  if (!imagePath || failed) {
    return null;
  }

  if (fill) {
    return (
      <Image
        src={imagePath}
        alt={`${brand} ${model}`}
        fill
        sizes="(max-width: 768px) 100vw, 672px"
        className={cn("object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={imagePath}
      alt={`${brand} ${model}`}
      width={640}
      height={360}
      sizes="(max-width: 640px) 100vw, 640px"
      className={cn("aspect-video w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
