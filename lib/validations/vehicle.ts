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
    /**
     * Set when the user confirms "I just had the whole car serviced" — resets
     * every individually tracked item to this same reading/date. Each item
     * otherwise keeps its own service history, so updating only the vehicle's
     * blanket reading leaves them reading as overdue.
     */
    markItemsServiced: z.boolean().optional(),
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
