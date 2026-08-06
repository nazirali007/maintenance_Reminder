import { z } from "zod";

export const vehicleSchema = z
  .object({
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "PETROL_HYBRID", "PETROL_CNG"]),
    transmission: z.enum(["MANUAL", "AUTOMATIC"]),
    currentMileage: z.coerce
      .number()
      .int()
      .min(0, "Odometer must be 0 or greater"),
    lastServiceMileage: z.coerce
      .number()
      .int()
      .min(0, "Odometer must be 0 or greater"),
    lastServiceDate: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.lastServiceMileage <= data.currentMileage, {
    message: "Can't be higher than the current odometer",
    path: ["lastServiceMileage"],
  });

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const odometerUpdateSchema = z.object({
  reading: z.coerce.number().int().min(0, "Odometer must be 0 or greater"),
});

export type OdometerUpdateInput = z.infer<typeof odometerUpdateSchema>;
