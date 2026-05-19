import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { extractRecordingBase64 } from './recordingResponse';

export type RecordingPlayback = {
  uri: string;
  release: () => void;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return globalThis.btoa(binary);
}

function extensionForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('quicktime')) return 'mov';
  if (m.includes('mp2t') || m.includes('mpegurl')) return 'm3u8';
  return 'mp4';
}

function mimeForExtension(ext: string): string {
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/quicktime';
  return 'video/mp4';
}

async function bytesToPlaybackUri(
  data: ArrayBuffer,
  contentType: string,
  cacheKey: string,
): Promise<RecordingPlayback> {
  const ext = extensionForMime(contentType);
  const mime = contentType || mimeForExtension(ext);
  const base64 = arrayBufferToBase64(data);

  if (Platform.OS === 'web') {
    const blob = new Blob([data], { type: mime });
    const uri = URL.createObjectURL(blob);
    return {
      uri,
      release: () => URL.revokeObjectURL(uri),
    };
  }

  const fileUri = `${FileSystem.cacheDirectory}recording-${cacheKey}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

  return {
    uri: fileUri,
    release: () => {
      void FileSystem.deleteAsync(fileUri, { idempotent: true });
    },
  };
}

/** Decode JSON envelope that carries base64 video bytes instead of raw binary body. */
function tryPlaybackFromJsonBytes(body: ArrayBuffer, cacheKey: string): Promise<RecordingPlayback | null> {
  try {
    const text = new TextDecoder().decode(body);
    const parsed: unknown = JSON.parse(text);
    const base64 = extractRecordingBase64(parsed);
    if (!base64) return Promise.resolve(null);

    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytesToPlaybackUri(bytes.buffer, 'video/mp4', cacheKey);
  } catch {
    return Promise.resolve(null);
  }
}

export async function bufferToRecordingPlayback(
  data: ArrayBuffer,
  contentType: string,
  cacheKey: string,
): Promise<RecordingPlayback | null> {
  if (!data.byteLength) return null;

  const mime = contentType.toLowerCase();
  if (mime.includes('application/json') || mime.includes('text/json')) {
    const fromJson = await tryPlaybackFromJsonBytes(data, cacheKey);
    if (fromJson) return fromJson;
    return null;
  }

  return bytesToPlaybackUri(data, contentType, cacheKey);
}

export function releaseRecordingPlayback(playback: RecordingPlayback | null | undefined): void {
  playback?.release();
}
