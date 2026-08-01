"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlertIcon size={28} />
      </div>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the
        dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
