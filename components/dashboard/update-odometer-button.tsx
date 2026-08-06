"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GaugeIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UpdateOdometerButton({
  vehicleId,
  currentMileage,
  isOverdue,
}: {
  vehicleId: string;
  currentMileage: number;
  isOverdue: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(String(currentMileage));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setReading(String(currentMileage));
    setFormError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const res = await fetch(`/api/vehicles/${vehicleId}/odometer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reading }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setFormError(
        body?.error?.reading?.[0] ?? "Something went wrong. Please try again."
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="default"
            size="sm"
            className={cn("cursor-pointer border border-red-500 bg-transparent hover:bg-transparent", isOverdue && "border border-warning text-warning")}
          />
        }
      >
        <GaugeIcon />
        Update Odometer
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Odometer</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={`odometer-${vehicleId}`}>
              Current reading (km)
            </FieldLabel>
            <Input
              id={`odometer-${vehicleId}`}
              type="number"
              inputMode="numeric"
              min={currentMileage}
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              autoFocus
            />
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
