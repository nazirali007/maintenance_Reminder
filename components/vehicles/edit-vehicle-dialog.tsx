"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";

import { vehicleSchema, type VehicleInput } from "@/lib/validations/vehicle";
import type { Vehicle } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VehicleFormFields } from "@/components/vehicles/vehicle-form-fields";

type FieldErrors = Partial<Record<keyof VehicleInput, string[]>>;

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function EditVehicleDialog({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues: VehicleInput = {
    brand: vehicle.brand,
    model: vehicle.model,
    variant: vehicle.variant ?? "",
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    year: vehicle.year,
    currentMileage: vehicle.currentMileage,
    purchaseDate: toDateInputValue(vehicle.purchaseDate),
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

  const onSubmit = async (data: VehicleInput) => {
    setFormError(null);

    const res = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
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
          <Button variant="outline" size="icon-sm" aria-label="Edit vehicle" />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <VehicleFormFields control={control} register={register} errors={errors} />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
