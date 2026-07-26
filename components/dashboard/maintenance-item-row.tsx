import { cn } from "@/lib/utils";
import { getMaintenanceDueInfo } from "@/lib/maintenance";
import { EditMaintenanceItemDialog } from "@/components/dashboard/edit-maintenance-item-dialog";
import { DeleteMaintenanceItemDialog } from "@/components/dashboard/delete-maintenance-item-dialog";

export function MaintenanceItemRow({
  vehicleId,
  item,
  currentMileage,
}: {
  vehicleId: string;
  item: {
    id: string;
    name: string;
    intervalKm: number;
    lastServiceMileage: number;
  };
  currentMileage: number;
}) {
  const { label, status } = getMaintenanceDueInfo(item, currentMileage);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm font-medium">{item.name}</span>
      <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-1.5">
          <EditMaintenanceItemDialog vehicleId={vehicleId} item={item} />
          <DeleteMaintenanceItemDialog vehicleId={vehicleId} item={item} />
        </div>
      </div>
    </div>
  );
}
