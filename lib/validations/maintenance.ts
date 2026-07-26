import { z } from "zod";

export const maintenanceItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  intervalKm: z.coerce.number().int().min(1, "Interval must be greater than 0"),
  lastServiceMileage: z.coerce
    .number()
    .int()
    .min(0, "Mileage must be 0 or greater"),
  notes: z.string().optional().or(z.literal("")),
});

export type MaintenanceItemInput = z.infer<typeof maintenanceItemSchema>;

export const maintenanceChecklistSchema = z
  .object({
    lastServiceMileage: z.coerce
      .number()
      .int()
      .min(0, "Mileage must be 0 or greater"),
    notes: z.string().optional().or(z.literal("")),
    items: z.array(
      z.object({
        name: z.string().min(1),
        intervalKm: z.coerce.number().int().min(1),
      })
    ),
  })
  .refine((data) => data.items.length > 0 || !!data.notes?.trim(), {
    message: "Select at least one item that was serviced, or add a note",
    path: ["items"],
  });

export type MaintenanceChecklistInput = z.infer<typeof maintenanceChecklistSchema>;
