import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function VehicleCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardHeader className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <Skeleton className="h-5 min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export default function VehiclesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
      </div>
    </div>
  );
}
