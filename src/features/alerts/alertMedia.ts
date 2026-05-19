import type { AlertDto } from './alerts.types';

function resolveImageUri(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  return `data:image/jpeg;base64,${s}`;
}

/** List cards — prefer API `thumbnail`, fall back to `frame`. */
export function getAlertThumbnailUri(alert: Pick<AlertDto, 'frame' | 'thumbnail'>): string | null {
  return resolveImageUri(alert.thumbnail ?? alert.frame);
}

/** Detail incident image — prefer full `frame`, fall back to `thumbnail`. */
export function getAlertFrameUri(alert: Pick<AlertDto, 'frame' | 'thumbnail'>): string | null {
  return resolveImageUri(alert.frame ?? alert.thumbnail);
}

/** @deprecated Use getAlertThumbnailUri or getAlertFrameUri */
export function getAlertImageUri(alert: Pick<AlertDto, 'frame' | 'thumbnail'>): string | null {
  return getAlertThumbnailUri(alert);
}
