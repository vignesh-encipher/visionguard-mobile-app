/** IST = UTC+5:30 — dashboard "day" matches backend (00:00–23:59:59.999 IST as UTC instants). */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type DashboardDayRange = {
  startTime: string;
  endTime: string;
};

/**
 * One calendar day in IST, as UTC ISO strings for the dashboard API.
 * e.g. for 19 May 2026 IST:
 *   startTime 2026-05-18T18:30:00.000Z
 *   endTime   2026-05-19T18:29:59.999Z
 */
export function getDashboardDayRangeUtc(referenceDate: Date = new Date()): DashboardDayRange {
  const istMs = referenceDate.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth();
  const d = istDate.getUTCDate();

  const startUtcMs = Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS;
  const endUtcMs = Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS;

  return {
    startTime: new Date(startUtcMs).toISOString(),
    endTime: new Date(endUtcMs).toISOString(),
  };
}
