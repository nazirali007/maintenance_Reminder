"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { vehicleSchema, type VehicleInput } from "@/lib/validations/vehicle";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldErrors = Partial<Record<keyof VehicleInput, string[]>>;

const FUEL_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CNG", label: "CNG" },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATIC", label: "Automatic" },
] as const;

export function AddVehicleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit = async (data: VehicleInput) => {
    setFormError(null);

    const res = await fetch("/api/vehicles", {
      method: "POST",
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

    reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
          setFormError(null);
        }
      }}
    >
      <DialogTrigger render={<Button>Add Vehicle</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
        </DialogHeader>

        {formError && (
          <p className="text-sm text-destructive">{formError}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.brand}>
              <FieldLabel htmlFor="brand">Brand</FieldLabel>
              <Input id="brand" placeholder="Toyota" {...register("brand")} />
              <FieldError errors={[errors.brand]} />
            </Field>

            <Field data-invalid={!!errors.model}>
              <FieldLabel htmlFor="model">Model</FieldLabel>
              <Input id="model" placeholder="Urban Cruiser" {...register("model")} />
              <FieldError errors={[errors.model]} />
            </Field>

            <Field data-invalid={!!errors.variant}>
              <FieldLabel htmlFor="variant">Variant</FieldLabel>
              <Input id="variant" placeholder="ZX" {...register("variant")} />
              <FieldError errors={[errors.variant]} />
            </Field>

            <Field data-invalid={!!errors.fuelType}>
              <FieldLabel htmlFor="fuelType">Fuel</FieldLabel>
              <Controller
                name="fuelType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="fuelType" className="w-full">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.fuelType]} />
            </Field>

            <Field data-invalid={!!errors.transmission}>
              <FieldLabel htmlFor="transmission">Transmission</FieldLabel>
              <Controller
                name="transmission"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="transmission" className="w-full">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSMISSION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.transmission]} />
            </Field>

            <Field data-invalid={!!errors.year}>
              <FieldLabel htmlFor="year">Year</FieldLabel>
              <Input
                id="year"
                type="number"
                placeholder="2022"
                {...register("year")}
              />
              <FieldError errors={[errors.year]} />
            </Field>

            <Field data-invalid={!!errors.currentMileage}>
              <FieldLabel htmlFor="currentMileage">Current Odometer</FieldLabel>
              <Input
                id="currentMileage"
                type="number"
                placeholder="42500 km"
                {...register("currentMileage")}
              />
              <FieldError errors={[errors.currentMileage]} />
            </Field>

            <Field data-invalid={!!errors.purchaseDate}>
              <FieldLabel htmlFor="purchaseDate">
                Purchase Date <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
              <FieldError errors={[errors.purchaseDate]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
