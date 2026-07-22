import { z } from "zod";

export const maintenanceItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  intervalKm: z.coerce.number().int().min(1, "Interval must be greater than 0"),
  lastServiceMileage: z.coerce
    .number()
    .int()
    .min(0, "Mileage must be 0 or greater"),
});

export type MaintenanceItemInput = z.infer<typeof maintenanceItemSchema>;
