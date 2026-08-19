"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, WrenchIcon } from "lucide-react";

import { vehicleSchema, type VehicleInput } from "@/lib/validations/vehicle";
import type { Vehicle } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VehicleFormFields } from "@/components/vehicles/vehicle-form-fields";
import { VehiclePhotoPreview } from "@/components/vehicles/vehicle-photo-preview";

type FieldErrors = Partial<Record<keyof VehicleInput, string[]>>;

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function EditVehicleDialog({
  vehicle,
  triggerClassName,
  maintenanceItemCount,
}: {
  vehicle: Vehicle;
  /** Lets callers restyle the trigger — e.g. for the dashboard's dark hero image. */
  triggerClassName?: string;
  /** Drives the "also mark tracked items as serviced" option; omit where the count isn't loaded. */
  maintenanceItemCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues: VehicleInput = {
    brand: vehicle.brand,
    model: vehicle.model,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    currentMileage: vehicle.currentMileage,
    lastServiceMileage: vehicle.lastServiceMileage,
    lastServiceDate: toDateInputValue(vehicle.lastServiceDate),
  };

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues,
  });

  // Raising the last-service reading means "I just had this car serviced" —
  // worth confirming, since it resets the car's service reminders.
  const watchedLastService = Number(useWatch({ control, name: "lastServiceMileage" }));
  const isNewService =
    Number.isFinite(watchedLastService) &&
    watchedLastService > vehicle.lastServiceMileage;
  const [markItemsServiced, setMarkItemsServiced] = useState(false);
  const trackedItemCount = maintenanceItemCount ?? 0;

  const onSubmit = async (data: VehicleInput) => {
    setFormError(null);

    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        markItemsServiced: isNewService && markItemsServiced,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      const fieldErrors: FieldErrors | undefined = body.error;

      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          setError(field as keyof VehicleInput, {
            message: messages?.[0],
          });
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset(defaultValues);
          setFormError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Edit vehicle"
            className={cn("cursor-pointer", triggerClassName)}
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <VehiclePhotoPreview control={control} />

        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <VehicleFormFields control={control} register={register} errors={errors} />

          {isNewService && (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
              <div className="flex items-start gap-2">
                <WrenchIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm">
                  Marking this car as serviced at{" "}
                  <strong>{watchedLastService.toLocaleString("en-US")} km</strong>.
                  Saving will clear its service reminders.
                </p>
              </div>

              {trackedItemCount > 0 && (
                <label className="flex items-start gap-2.5 pl-6">
                  <Checkbox
                    className="mt-0.5"
                    checked={markItemsServiced}
                    onCheckedChange={(checked) => setMarkItemsServiced(checked === true)}
                  />
                  <span className="text-sm">
                    Also mark {trackedItemCount} tracked{" "}
                    {trackedItemCount === 1 ? "item" : "items"} as serviced
                    <span className="block text-xs text-muted-foreground">
                      Tick this if the full service covered them — otherwise they
                      stay on their own schedules and may still show as due.
                    </span>
                  </span>
                </label>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isNewService ? "Confirm & save" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
