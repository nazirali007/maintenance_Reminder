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
  { value: "HYBRID", label: "Hybrid" },
  { value: "CNG", label: "CNG" },
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
    <FieldGroup className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
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
      <div className="sm:col-span-2">
        <FieldError errors={[errors.brand]} />
        <FieldError errors={[errors.model]} />
      </div>

      <Field data-invalid={!!errors.variant}>
        <FieldLabel htmlFor="variant">Variant</FieldLabel>
        <Input id="variant" placeholder="ZX" {...register("variant")} />
        <FieldError errors={[errors.variant]} />
      </Field>

      <Field data-invalid={!!errors.year}>
        <FieldLabel htmlFor="year">Year</FieldLabel>
        <Input id="year" type="number" placeholder="2022" {...register("year")} />
        <FieldError errors={[errors.year]} />
      </Field>

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

      <Field data-invalid={!!errors.purchaseDate}>
        <FieldLabel htmlFor="purchaseDate">
          Purchase Date <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        <FieldError errors={[errors.purchaseDate]} />
      </Field>
    </FieldGroup>
  );
}
