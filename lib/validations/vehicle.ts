import { z } from "zod";

export const vehicleSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  variant: z.string().optional().or(z.literal("")),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]),
  year: z.coerce
    .number()
    .int()
    .min(1980, "Enter a valid year")
    .max(new Date().getFullYear() + 1, "Enter a valid year"),
  currentMileage: z.coerce
    .number()
    .int()
    .min(0, "Odometer must be 0 or greater"),
  purchaseDate: z.string().optional().or(z.literal("")),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
