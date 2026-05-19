import type { AlertDto } from '../alerts/alerts.types';

const RECORDING_PADDING_MS = 5000;

export function pickEpoch(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Same window logic as the web `getAnalyticsBarDetails` caller. */
export function getRecordingEpochRange(
  detail: Pick<AlertDto, 'receivedAt' | 'startEpochTime' | 'endEpochTime'>,
): { startTime: number; endTime: number } | null {
  if (!detail.receivedAt) return null;
  const receivedMs = new Date(detail.receivedAt).getTime();
  if (!Number.isFinite(receivedMs)) return null;

  return {
    startTime: pickEpoch(detail.startEpochTime, receivedMs - RECORDING_PADDING_MS),
    endTime: pickEpoch(detail.endEpochTime, receivedMs + RECORDING_PADDING_MS),
  };
}
