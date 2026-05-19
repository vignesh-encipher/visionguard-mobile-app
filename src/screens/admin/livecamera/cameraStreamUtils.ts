import type { MonitorCameraDto } from '../../../features/cameras/cameras.types';

export function cameraIsLive(cam: MonitorCameraDto): boolean {
  if (typeof cam.cameraOnline === 'boolean') return cam.cameraOnline;
  return (cam.status ?? '').toUpperCase() === 'LIVE';
}

/** Prefer WebRTC viewer page, then HLS, then generic stream URL. */
export function pickStreamUrl(cam: MonitorCameraDto): string | null {
  const candidates = [cam.mediaMtxWebRtcUrl, cam.hlsUrl, cam.streamUrl];
  for (const c of candidates) {
    const s = typeof c === 'string' ? c.trim() : '';
    if (s) return s;
  }
  return null;
}

export function cameraSubtitle(cam: MonitorCameraDto): string {
  const parts = [cam.siteName, cam.zoneName].filter(Boolean);
  return parts.join(' · ') || cam.ip || '';
}

export function extractModelKeys(cam: MonitorCameraDto): string[] {
  if (!Array.isArray(cam.modelConfigs) || cam.modelConfigs.length === 0) {
    return ['HELMET_DETECTION', 'VEST_DETECTION'];
  }
  return cam.modelConfigs
    .map((item) => {
      if (typeof item === 'string') return item.trim().toUpperCase();
      if (item && typeof item === 'object') {
        const modelName = (item as { modelName?: unknown }).modelName;
        if (typeof modelName === 'string' && modelName.trim()) return modelName.trim().toUpperCase();
      }
      return null;
    })
    .filter((v): v is string => Boolean(v));
}

export function formatModelLabel(modelKey: string): string {
  return modelKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function streamModeLabel(cam: MonitorCameraDto): string {
  const mode = cam.optimizationType?.trim();
  return mode ? mode.split('_').join(' ') : '---';
}
