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
  /** Skip lazy-loading and the image-optimization round trip — for icons that must render instantly (e.g. the brand marquee), not for off-screen/lazy contexts. */
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
        loading={eager ? "eager" : "lazy"}
        unoptimized={eager}
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
