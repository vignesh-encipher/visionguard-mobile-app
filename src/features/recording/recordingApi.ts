import { getApiBaseUrl } from '../../config/env';
import { getApiErrorMessage } from '../../utils/apiError';
import { getAuthToken } from '../../utils/storage';
import {
  bufferToRecordingPlayback,
  type RecordingPlayback,
  releaseRecordingPlayback,
} from './recordingBytes';

export type GetAnalyticsBarDetailsArgs = {
  cameraId: string;
  startTime: number;
  endTime: number;
  modelType?: string | null;
};

export { type RecordingPlayback, releaseRecordingPlayback };

function buildRecordingRequestUrl(args: GetAnalyticsBarDetailsArgs): string {
  const { cameraId, startTime, endTime, modelType } = args;
  const params = new URLSearchParams({
    cameraId,
    startTimestamp: String(startTime),
    endTimestamp: String(endTime),
  });
  if (modelType?.trim()) {
    params.set('modelType', modelType.trim());
  }
  const base = getApiBaseUrl().replace(/\/+$/, '');
  return `${base}/recording/get?${params.toString()}`;
}

/**
 * Fetches incident recording as binary stream bytes (`GET /recording/get`),
 * writes to a local playable URI (cache file or blob URL).
 */
export async function getAnalyticsBarDetails(
  args: GetAnalyticsBarDetailsArgs,
): Promise<RecordingPlayback | null> {
  const token = await getAuthToken();
  const url = buildRecordingRequestUrl(args);
  const cacheKey = `${args.cameraId}-${args.startTime}-${args.endTime}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      throw new Error(`Recording request failed (${res.status})`);
    }

    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? 'video/mp4';
    const data = await res.arrayBuffer();

    return bufferToRecordingPlayback(data, contentType, cacheKey);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Recording request failed')) {
      throw e;
    }
    throw new Error(getApiErrorMessage(e, 'Failed to load violation recording'));
  }
}
