import { cn } from "@/lib/utils";
import { getMaintenanceDueInfo } from "@/lib/maintenance";

export function MaintenanceItemRow({
  item,
  currentMileage,
}: {
  item: { name: string; intervalKm: number; lastServiceMileage: number };
  currentMileage: number;
}) {
  const { label, isOverdue } = getMaintenanceDueInfo(item, currentMileage);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm font-medium">{item.name}</span>
      <span
        className={cn(
          "text-sm",
          isOverdue ? "font-semibold text-destructive" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
