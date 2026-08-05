import { WrenchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { MaintenanceDueInfo } from "@/lib/maintenance";

export function VehicleServiceAlert({ dueInfo }: { dueInfo: MaintenanceDueInfo }) {
  if (dueInfo.status === "ok") return null;

  return (
    <Alert
      variant={dueInfo.isOverdue ? "destructive" : "default"}
      className={cn(
        !dueInfo.isOverdue &&
          "border-warning/40 bg-warning/10 [&_svg]:text-warning"
      )}
    >
      <WrenchIcon />
      <AlertTitle className={cn(!dueInfo.isOverdue && "text-warning")}>
        {dueInfo.isOverdue ? "Service overdue" : "Service needed soon"}
      </AlertTitle>
      <AlertDescription className={cn(!dueInfo.isOverdue && "text-warning/80")}>
        {dueInfo.isOverdue
          ? "This car is overdue for its 10,000 km / annual service."
          : `${dueInfo.label} until this car's next 10,000 km / annual service.`}
      </AlertDescription>
    </Alert>
  );
}
