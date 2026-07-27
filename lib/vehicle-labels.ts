import type { Vehicle } from "@/lib/generated/prisma/client";

export const FUEL_LABELS: Record<Vehicle["fuelType"], string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  CNG: "CNG",
};

export const TRANSMISSION_LABELS: Record<Vehicle["transmission"], string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
};
