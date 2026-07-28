"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MaintenanceItemRow } from "@/components/dashboard/maintenance-item-row";

const VISIBLE_COUNT = 2;

export function UpcomingMaintenanceList({
  vehicleId,
  items,
  currentMileage,
}: {
  vehicleId: string;
  items: {
    id: string;
    name: string;
    intervalKm: number;
    lastServiceMileage: number;
    lastServiceDate: Date | null;
    notes: string | null;
  }[];
  currentMileage: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No maintenance items tracked yet.
      </p>
    );
  }

  const hasMore = items.length > VISIBLE_COUNT;
  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hiddenCount = items.length - VISIBLE_COUNT;

  return (
    <div className="flex flex-col gap-2">
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            index >= VISIBLE_COUNT &&
              "animate-in fade-in slide-in-from-top-2 duration-300"
          )}
          style={index >= VISIBLE_COUNT ? { animationDelay: `${(index - VISIBLE_COUNT) * 60}ms` } : undefined}
        >
          <MaintenanceItemRow
            vehicleId={vehicleId}
            item={item}
            currentMileage={currentMileage}
          />
        </div>
      ))}

      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="group self-start"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
          {expanded ? (
            <ChevronUpIcon className="transition-transform group-hover:-translate-y-0.5" />
          ) : (
            <ChevronDownIcon className="transition-transform group-hover:translate-y-0.5" />
          )}
        </Button>
      )}
    </div>
  );
}
