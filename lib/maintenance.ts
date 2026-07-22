interface MaintenanceLike {
  intervalKm: number;
  lastServiceMileage: number;
}

export type MaintenanceStatus = "ok" | "due-soon" | "overdue";

const DUE_SOON_THRESHOLD_KM = 500;

export interface MaintenanceDueInfo {
  remainingKm: number;
  isOverdue: boolean;
  status: MaintenanceStatus;
  label: string;
}

export function getMaintenanceDueInfo(
  item: MaintenanceLike,
  currentMileage: number
): MaintenanceDueInfo {
  const dueAtMileage = item.lastServiceMileage + item.intervalKm;
  const remainingKm = dueAtMileage - currentMileage;
  const isOverdue = remainingKm <= 0;
  const status: MaintenanceStatus = isOverdue
    ? "overdue"
    : remainingKm <= DUE_SOON_THRESHOLD_KM
      ? "due-soon"
      : "ok";

  return {
    remainingKm,
    isOverdue,
    status,
    label: isOverdue
      ? "Overdue"
      : `Due in ${remainingKm.toLocaleString("en-US")} km`,
  };
}

/**
 * Weighted average across all tracked items — each item contributes 1 for
 * "ok", 0.6 for "due-soon", or 0.1 for "overdue" — rather than a continuous
 * fraction, so a single overdue item drags the score down sharply instead of
 * fading in gradually. No items tracked yet defaults to 100 — nothing to flag.
 */
const HEALTH_WEIGHTS: Record<MaintenanceStatus, number> = {
  ok: 1,
  "due-soon": 0.6,
  overdue: 0.1,
};

export function computeHealthScore(
  items: MaintenanceLike[],
  currentMileage: number
): number {
  if (items.length === 0) return 100;

  const total = items.reduce((sum, item) => {
    const { status } = getMaintenanceDueInfo(item, currentMileage);
    return sum + HEALTH_WEIGHTS[status];
  }, 0);

  return Math.round((total / items.length) * 100);
}

export function getHealthScoreStatus(score: number): MaintenanceStatus {
  if (score >= 80) return "ok";
  if (score >= 50) return "due-soon";
  return "overdue";
}

export function sortByUrgency<T extends MaintenanceLike>(
  items: T[],
  currentMileage: number
): T[] {
  return [...items].sort(
    (a, b) =>
      getMaintenanceDueInfo(a, currentMileage).remainingKm -
      getMaintenanceDueInfo(b, currentMileage).remainingKm
  );
}
