"use client";

import { useState } from "react";
import Image from "next/image";
import { CarIcon } from "lucide-react";

import { findBrand, getBrandColor, getBrandLogoPath } from "@/lib/car-catalog";
import { cn } from "@/lib/utils";

export function BrandIcon({
  brand,
  size = 32,
  className,
  eager = false,
}: {
  brand: string;
  size?: number;
  className?: string;
  /** Load immediately instead of lazily — for icons visible on first paint (e.g. the brand marquee). */
  eager?: boolean;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const brandData = findBrand(brand);
  const logoPath = brandData ? getBrandLogoPath(brandData.id) : undefined;

  if (logoPath && !logoFailed) {
    return (
      <Image
        src={logoPath}
        alt={brand}
        width={size}
        height={size}
        // Eager only affects *when* the fetch starts. Optimization stays on:
        // these source PNGs run up to 613KB, and serving the original to fill
        // a 48px box downloaded ~3.5MB across the marquee. Resized, each is a
        // few KB — so eager here is both instant and cheap.
        loading={eager ? "eager" : "lazy"}
        className={cn("shrink-0 rounded-sm p-1 object-contain bg-white", className)}
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
