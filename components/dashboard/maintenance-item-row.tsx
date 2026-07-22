import { cn } from "@/lib/utils";
import { getMaintenanceDueInfo } from "@/lib/maintenance";

export function MaintenanceItemRow({
  item,
  currentMileage,
}: {
  item: { name: string; intervalKm: number; lastServiceMileage: number };
  currentMileage: number;
}) {
  const { label, status } = getMaintenanceDueInfo(item, currentMileage);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm font-medium">{item.name}</span>
      <span
        className={cn(
          "text-sm",
          status === "overdue" && "font-semibold text-destructive",
          status === "due-soon" && "font-medium text-warning",
          status === "ok" && "text-success"
        )}
      >
        {label}
      </span>
    </div>
  );
}
