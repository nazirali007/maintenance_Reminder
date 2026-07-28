import { runDailyMaintenanceCheck } from "@/lib/server/maintenance-cron";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  const summary = await runDailyMaintenanceCheck({ dryRun });

  return Response.json({ dryRun, ...summary });
}
