import type { CameraModelConfig, MonitorCameraDto } from '../../../features/cameras/cameras.types';

export type CameraStreamUrlVariant = 'default' | 'user';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Stream URL priority aligned with web `getCameraStreamUrl`. */
export function getCameraStreamUrl(
  response: MonitorCameraDto | null | undefined,
  variant: CameraStreamUrlVariant = 'default',
): string {
  if (response == null) return '';

  if (variant === 'user') {
    if (isNonEmptyString(response.hlsUrl)) return response.hlsUrl.trim();
    if (isNonEmptyString(response.analyticStreamUrl)) return response.analyticStreamUrl.trim();
    if (isNonEmptyString(response.defaultAnalyticsUrl)) return response.defaultAnalyticsUrl.trim();
    if (isNonEmptyString(response.streamUrl)) return response.streamUrl.trim();
    if (isNonEmptyString(response.mediaMtxWebRtcUrl)) return response.mediaMtxWebRtcUrl.trim();
    return '';
  }

  if (isNonEmptyString(response.genericVideoFeedBroadCastUrl)) {
    return response.genericVideoFeedBroadCastUrl.trim();
  }
  if (isNonEmptyString(response.analyticStreamUrl)) return response.analyticStreamUrl.trim();
  if (isNonEmptyString(response.defaultAnalyticsUrl)) return response.defaultAnalyticsUrl.trim();
  if (isNonEmptyString(response.mediaMtxWebRtcUrl)) return response.mediaMtxWebRtcUrl.trim();
  if (isNonEmptyString(response.streamUrl)) return response.streamUrl.trim();
  if (isNonEmptyString(response.hlsUrl)) return response.hlsUrl.trim();
  return '';
}

/** Live list cards — default variant (broadcast / analytics first). */
export function pickStreamUrl(cam: MonitorCameraDto): string | null {
  const url = getCameraStreamUrl(cam, 'default');
  return url || null;
}

export function cameraIsLive(cam: MonitorCameraDto): boolean {
  if (typeof cam.cameraOnline === 'boolean') return cam.cameraOnline;
  return (cam.status ?? '').toUpperCase() === 'LIVE';
}

export function formatBitrateLabel(maxBitrate?: number | null): string {
  if (maxBitrate == null || !Number.isFinite(maxBitrate)) return '0 Kbps';
  return `${maxBitrate} Kbps`;
}

export function compressionLabel(compressionEnabled?: boolean | null): string {
  if (compressionEnabled === true) return 'Enabled';
  if (compressionEnabled === false) return 'Disabled';
  return '---';
}

export function cameraSubtitle(cam: MonitorCameraDto): string {
  const parts = [cam.siteName, cam.zoneName].filter(Boolean);
  return parts.join(' · ') || cam.ip || '';
}

export function parseModelConfigs(cam: MonitorCameraDto): CameraModelConfig[] {
  if (!Array.isArray(cam.modelConfigs)) return [];

  return cam.modelConfigs
    .map((item): CameraModelConfig | null => {
      if (typeof item === 'string') {
        const modelType = item.trim().toUpperCase();
        return modelType ? { modelType, isEnabled: true } : null;
      }
      if (!item || typeof item !== 'object') return null;

      const o = item as Record<string, unknown>;
      const rawType =
        (typeof o.modelType === 'string' && o.modelType.trim()) ||
        (typeof o.modelName === 'string' && o.modelName.trim()) ||
        '';
      if (!rawType) return null;

      return {
        modelType: rawType.toUpperCase(),
        color: typeof o.color === 'string' ? o.color : null,
        boxText: typeof o.boxText === 'string' ? o.boxText : null,
        isEnabled: typeof o.isEnabled === 'boolean' ? o.isEnabled : true,
      };
    })
    .filter((v): v is CameraModelConfig => v != null);
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
