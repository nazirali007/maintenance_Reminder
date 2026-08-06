import type {
  Control,
  FieldErrors as RHFFieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import type { VehicleInput } from "@/lib/validations/vehicle";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandModelSelect } from "@/components/vehicles/brand-model-select";

const FUEL_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "PETROL_HYBRID", label: "Petrol + Hybrid" },
  { value: "PETROL_CNG", label: "Petrol + CNG" },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATIC", label: "Automatic" },
] as const;

export function VehicleFormFields({
  control,
  register,
  errors,
}: {
  control: Control<VehicleInput>;
  register: UseFormRegister<VehicleInput>;
  errors: RHFFieldErrors<VehicleInput>;
}) {
  return (
    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Controller
        name="brand"
        control={control}
        render={({ field: brandField }) => (
          <Controller
            name="model"
            control={control}
            render={({ field: modelField }) => (
              <BrandModelSelect
                brand={brandField.value ?? ""}
                model={modelField.value ?? ""}
                onBrandChange={brandField.onChange}
                onModelChange={modelField.onChange}
              />
            )}
          />
        )}
      />
      <FieldError errors={[errors.brand, errors.model]} className="sm:col-span-2" />

      <Field data-invalid={!!errors.fuelType}>
        <FieldLabel htmlFor="fuelType">Fuel</FieldLabel>
        <Controller
          name="fuelType"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? null} onValueChange={field.onChange}>
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
            <Select value={field.value ?? null} onValueChange={field.onChange}>
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

      <Field data-invalid={!!errors.lastServiceMileage}>
        <FieldLabel htmlFor="lastServiceMileage">Last Service Odometer</FieldLabel>
        <Input
          id="lastServiceMileage"
          type="number"
          placeholder="40000 km"
          {...register("lastServiceMileage")}
        />
        <FieldError errors={[errors.lastServiceMileage]} />
      </Field>

      <Field data-invalid={!!errors.lastServiceDate}>
        <FieldLabel htmlFor="lastServiceDate">
          Last Service Date{" "}
          <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="lastServiceDate" type="date" {...register("lastServiceDate")} />
        <FieldError errors={[errors.lastServiceDate]} />
      </Field>
    </FieldGroup>
  );
}
