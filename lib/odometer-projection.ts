export interface OdometerLogLike {
  reading: number;
  recordedAt: Date;
}

const FALLBACK_KM_PER_DAY = 30;
const ROLLING_WINDOW = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days without an odometer update before we nudge the user (dashboard highlight + email). */
export const ODOMETER_NUDGE_THRESHOLD_DAYS = 10;

export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

/**
 * Rolling average driving rate from the most recent logs. Falls back to a
 * flat estimate when there isn't enough history (or the data is degenerate,
 * e.g. a corrected/decreasing reading) to compute a meaningful rate.
 */
export function estimateDailyRate(
  logs: OdometerLogLike[]
): { kmPerDay: number; isFallback: boolean } {
  const sorted = [...logs].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );
  const window = sorted.slice(-ROLLING_WINDOW);

  if (window.length < 2) {
    return { kmPerDay: FALLBACK_KM_PER_DAY, isFallback: true };
  }

  const first = window[0];
  const last = window[window.length - 1];
  const days = Math.max(1, daysBetween(first.recordedAt, last.recordedAt));
  const rate = (last.reading - first.reading) / days;

  if (rate <= 0) {
    return { kmPerDay: FALLBACK_KM_PER_DAY, isFallback: true };
  }

  return { kmPerDay: rate, isFallback: false };
}

/**
 * Projects today's likely odometer reading from the last known log plus the
 * estimated daily rate. `logs` must be non-empty.
 */
export function projectCurrentMileage(
  logs: OdometerLogLike[],
  asOf: Date = new Date()
): number {
  const sorted = [...logs].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );
  const lastLog = sorted[sorted.length - 1];
  const { kmPerDay } = estimateDailyRate(sorted);
  const daysSince = Math.max(0, daysBetween(lastLog.recordedAt, asOf));

  return Math.round(lastLog.reading + kmPerDay * daysSince);
}

/**
 * A new odometer reading is only worth logging (for rate-calc purposes) if
 * it's actually higher than what's on record — a lower value is a manual
 * correction, not a new real-world data point, and would corrupt the rate.
 */
export function shouldLogOdometerReading(
  previousReading: number,
  nextReading: number
): boolean {
  return nextReading > previousReading;
}
