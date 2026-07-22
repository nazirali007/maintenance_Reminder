"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  maintenanceItemSchema,
  type MaintenanceItemInput,
} from "@/lib/validations/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";

type FieldErrors = Partial<Record<keyof MaintenanceItemInput, string[]>>;

export function AddMaintenanceItemDialog({
  vehicleId,
  currentMileage,
}: {
  vehicleId: string;
  currentMileage: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceItemInput>({
    resolver: zodResolver(maintenanceItemSchema),
    defaultValues: {
      lastServiceMileage: currentMileage,
    },
  });

  const onSubmit = async (data: MaintenanceItemInput) => {
    setFormError(null);

    const res = await fetch(`/api/vehicles/${vehicleId}/maintenance-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      const fieldErrors: FieldErrors | undefined = body.error;

      if (fieldErrors) {
        for (const [field, messages] of Object.entries(fieldErrors)) {
          setError(field as keyof MaintenanceItemInput, {
            message: messages?.[0],
          });
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      return;
    }

    reset({ lastServiceMileage: currentMileage });
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset({ lastServiceMileage: currentMileage });
          setFormError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline">Add Maintenance Item</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Maintenance Item</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" placeholder="Engine Oil" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.intervalKm}>
              <FieldLabel htmlFor="intervalKm">Service Interval (km)</FieldLabel>
              <Input
                id="intervalKm"
                type="number"
                placeholder="5000"
                {...register("intervalKm")}
              />
              <FieldError errors={[errors.intervalKm]} />
            </Field>

            <Field data-invalid={!!errors.lastServiceMileage}>
              <FieldLabel htmlFor="lastServiceMileage">
                Odometer at Last Service
              </FieldLabel>
              <Input
                id="lastServiceMileage"
                type="number"
                {...register("lastServiceMileage")}
              />
              <FieldError errors={[errors.lastServiceMileage]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Maintenance Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
