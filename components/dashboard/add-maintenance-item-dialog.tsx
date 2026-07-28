"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { MAINTENANCE_CATALOG } from "@/lib/maintenance-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";

export function AddMaintenanceItemDialog({
  vehicleId,
  currentMileage,
}: {
  vehicleId: string;
  currentMileage: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [odometer, setOdometer] = useState(String(currentMileage));
  const [serviceDate, setServiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setOdometer(String(currentMileage));
    setServiceDate(new Date().toISOString().slice(0, 10));
    setCheckedKeys(new Set());
    setNotes("");
    setFormError(null);
  }

  function toggleItem(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    setFormError(null);

    if (checkedKeys.size === 0 && notes.trim() === "") {
      setFormError("Select at least one item that was serviced, or add a note.");
      return;
    }

    const items = MAINTENANCE_CATALOG.flatMap((section) => section.items)
      .filter((item) => checkedKeys.has(item.key))
      .map((item) => ({ name: item.label, intervalKm: item.defaultIntervalKm }));

    setIsSubmitting(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/maintenance-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastServiceMileage: odometer,
        lastServiceDate: serviceDate,
        notes: notes.trim(),
        items,
      }),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setFormError("Something went wrong. Please try again.");
      return;
    }

    resetForm();
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
      <DialogTrigger render={<Button variant="outline">Add Maintenance Item</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Maintenance Item</DialogTitle>
        </DialogHeader>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="odometer">Odometer Reading (km)</FieldLabel>
              <Input
                id="odometer"
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="service-date">Service Date</FieldLabel>
              <Input
                id="service-date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">
              What was serviced?{" "}
              <span className="text-muted-foreground">(select all that apply)</span>
            </p>

            <div className="flex max-h-72 flex-col gap-5 overflow-y-auto pr-1">
              {MAINTENANCE_CATALOG.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    {section.title}
                  </p>
                  <div className="flex flex-col gap-2">
                    {section.items.map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 transition-colors has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checkedKeys.has(item.key)}
                          onCheckedChange={() => toggleItem(item.key)}
                        />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="notes">
              Additional Notes{" "}
              <span className="text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              id="notes"
              placeholder="Anything else done that isn't listed above..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

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
