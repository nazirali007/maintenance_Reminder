import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function VehicleCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardHeader className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <Skeleton className="h-5 flex-1 max-w-40" />
        <Skeleton className="h-7 w-12" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-7 w-56" />

      <Skeleton className="h-20 w-full rounded-xl" />

      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
    </div>
  );
}
