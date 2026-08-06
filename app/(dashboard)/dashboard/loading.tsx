import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function VehicleContentSkeleton() {
  return (
    <CardContent className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full rounded-lg" />

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    </CardContent>
  );
}

function HeroCardSkeleton() {
  return (
    <Card className="pt-0 lg:col-span-2">
      <Skeleton className="aspect-[4/3] w-full rounded-none sm:aspect-[21/9]" />
      <VehicleContentSkeleton />
    </Card>
  );
}

function VehicleCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardHeader className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <Skeleton className="h-5 max-w-40 flex-1" />
        <Skeleton className="h-7 w-12" />
      </CardHeader>
      <VehicleContentSkeleton />
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-none flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-7 w-56" />

      <Skeleton className="h-20 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HeroCardSkeleton />
        <VehicleCardSkeleton />
        <VehicleCardSkeleton />
      </div>
    </div>
  );
}
