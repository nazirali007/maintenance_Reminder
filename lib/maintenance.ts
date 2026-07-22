interface MaintenanceLike {
  intervalKm: number;
  lastServiceMileage: number;
}

export interface MaintenanceDueInfo {
  remainingKm: number;
  isOverdue: boolean;
  label: string;
}

export function getMaintenanceDueInfo(
  item: MaintenanceLike,
  currentMileage: number
): MaintenanceDueInfo {
  const dueAtMileage = item.lastServiceMileage + item.intervalKm;
  const remainingKm = dueAtMileage - currentMileage;
  const isOverdue = remainingKm <= 0;

  return {
    remainingKm,
    isOverdue,
    label: isOverdue
      ? "Overdue"
      : `Due in ${remainingKm.toLocaleString("en-US")} km`,
  };
}

/**
 * Average, across all tracked items, of how much of each service interval
 * remains (clamped to 0 once overdue rather than going negative). No items
 * tracked yet defaults to 100 — nothing to flag.
 */
export function computeHealthScore(
  items: MaintenanceLike[],
  currentMileage: number
): number {
  if (items.length === 0) return 100;

  const total = items.reduce((sum, item) => {
    const { remainingKm } = getMaintenanceDueInfo(item, currentMileage);
    const fractionRemaining = Math.min(1, Math.max(0, remainingKm) / item.intervalKm);
    return sum + fractionRemaining;
  }, 0);

  return Math.round((total / items.length) * 100);
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
