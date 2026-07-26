"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";

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

export function EditMaintenanceItemDialog({
  vehicleId,
  item,
}: {
  vehicleId: string;
  item: { id: string; name: string; intervalKm: number; lastServiceMileage: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues: MaintenanceItemInput = {
    name: item.name,
    intervalKm: item.intervalKm,
    lastServiceMileage: item.lastServiceMileage,
  };

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceItemInput>({
    resolver: zodResolver(maintenanceItemSchema),
    defaultValues,
  });

  const onSubmit = async (data: MaintenanceItemInput) => {
    setFormError(null);

    const res = await fetch(
      `/api/vehicles/${vehicleId}/maintenance-items/${item.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

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
          <Button variant="outline" size="icon-xs" aria-label="Edit maintenance item" />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Maintenance Item</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="edit-name">Name</FieldLabel>
              <Input id="edit-name" placeholder="Engine Oil" {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.intervalKm}>
              <FieldLabel htmlFor="edit-intervalKm">Service Interval (km)</FieldLabel>
              <Input
                id="edit-intervalKm"
                type="number"
                placeholder="5000"
                {...register("intervalKm")}
              />
              <FieldError errors={[errors.intervalKm]} />
            </Field>

            <Field data-invalid={!!errors.lastServiceMileage}>
              <FieldLabel htmlFor="edit-lastServiceMileage">
                Odometer at Last Service
              </FieldLabel>
              <Input
                id="edit-lastServiceMileage"
                type="number"
                {...register("lastServiceMileage")}
              />
              <FieldError errors={[errors.lastServiceMileage]} />
            </Field>
          </FieldGroup>

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
