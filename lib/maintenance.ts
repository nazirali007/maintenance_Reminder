import { daysBetween } from "@/lib/odometer-projection";

interface MaintenanceLike {
  intervalKm: number;
  lastServiceMileage: number;
  lastServiceDate: Date | null;
}

export type MaintenanceStatus = "ok" | "due-soon" | "overdue";

export const DUE_SOON_KM_THRESHOLD = 500;
export const DUE_SOON_DAYS = 15;
const SERVICE_INTERVAL_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Blanket whole-car service rule (distinct from per-item intervals): 10,000km or 1 year since the car was last serviced, whichever comes first. */
export const VEHICLE_SERVICE_INTERVAL_KM = 10000;
export const VEHICLE_SERVICE_DUE_SOON_KM = 1000;

export interface MaintenanceDueInfo {
  remainingKm: number;
  /** Days left until the 1-year service anniversary; null if no lastServiceDate is on record. */
  remainingDays: number | null;
  isOverdue: boolean;
  status: MaintenanceStatus;
  label: string;
  /** Projected calendar date this item will be due, from the driving-rate estimate. Display-only. */
  estimatedDueDate: Date | null;
  /** Whether mileage is a contributing reason for the current status (due-soon or overdue). */
  reasonKm: boolean;
  /** Whether the 1-year anniversary is a contributing reason for the current status. */
  reasonDate: boolean;
}

function computeDueInfo(
  intervalKm: number,
  dueSoonKm: number,
  lastServiceMileage: number,
  lastServiceDate: Date | null,
  currentMileage: number,
  options: { now?: Date; dailyRateKm?: number } = {}
): MaintenanceDueInfo {
  const now = options.now ?? new Date();

  const remainingKm = lastServiceMileage + intervalKm - currentMileage;
  const kmOverdue = remainingKm <= 0;
  const kmDueSoon = !kmOverdue && remainingKm <= dueSoonKm;

  let remainingDays: number | null = null;
  let dateOverdue = false;
  let dateDueSoon = false;
  if (lastServiceDate) {
    remainingDays = Math.round(
      SERVICE_INTERVAL_DAYS - daysBetween(lastServiceDate, now)
    );
    dateOverdue = remainingDays <= 0;
    dateDueSoon = !dateOverdue && remainingDays <= DUE_SOON_DAYS;
  }

  const isOverdue = kmOverdue || dateOverdue;
  const isDueSoon = !isOverdue && (kmDueSoon || dateDueSoon);
  const status: MaintenanceStatus = isOverdue
    ? "overdue"
    : isDueSoon
      ? "due-soon"
      : "ok";

  const estimatedDueDate =
    !isOverdue && remainingKm > 0 && options.dailyRateKm
      ? new Date(now.getTime() + (remainingKm / options.dailyRateKm) * MS_PER_DAY)
      : null;

  const label = isOverdue
    ? "Overdue"
    : dateDueSoon
      ? `Due in ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`
      : `Due in ${remainingKm.toLocaleString("en-US")} km`;

  return {
    remainingKm,
    remainingDays,
    isOverdue,
    status,
    label,
    estimatedDueDate,
    reasonKm: kmOverdue || kmDueSoon,
    reasonDate: dateOverdue || dateDueSoon,
  };
}

export function getMaintenanceDueInfo(
  item: MaintenanceLike,
  currentMileage: number,
  options: { now?: Date; dailyRateKm?: number } = {}
): MaintenanceDueInfo {
  return computeDueInfo(
    item.intervalKm,
    DUE_SOON_KM_THRESHOLD,
    item.lastServiceMileage,
    item.lastServiceDate,
    currentMileage,
    options
  );
}

interface VehicleServiceLike {
  currentMileage: number;
  lastServiceMileage: number;
  lastServiceDate: Date | null;
}

/**
 * The blanket whole-car reminder — separate from per-item tracking (Engine
 * Oil, Air Filter, etc. each have their own interval). This is the simple
 * "car needs a service" signal: 10,000km or 1 year since it was last
 * serviced, whichever comes first.
 */
export function getVehicleServiceDueInfo(
  vehicle: VehicleServiceLike,
  options: { now?: Date; dailyRateKm?: number } = {}
): MaintenanceDueInfo {
  return computeDueInfo(
    VEHICLE_SERVICE_INTERVAL_KM,
    VEHICLE_SERVICE_DUE_SOON_KM,
    vehicle.lastServiceMileage,
    vehicle.lastServiceDate,
    vehicle.currentMileage,
    options
  );
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

const STATUS_RANK: Record<MaintenanceStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  ok: 2,
};

export function sortByUrgency<T extends MaintenanceLike>(
  items: T[],
  currentMileage: number,
  options: { now?: Date } = {}
): T[] {
  return [...items].sort((a, b) => {
    const infoA = getMaintenanceDueInfo(a, currentMileage, options);
    const infoB = getMaintenanceDueInfo(b, currentMileage, options);
    const rankDiff = STATUS_RANK[infoA.status] - STATUS_RANK[infoB.status];
    return rankDiff !== 0 ? rankDiff : infoA.remainingKm - infoB.remainingKm;
  });
}
