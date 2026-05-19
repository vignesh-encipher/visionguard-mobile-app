/**
 * Stream classification aligned with the web `detectStreamType` / CameraStream player.
 * RN uses: HLS → expo-av, WebRTC/embed page → WebView, MJPEG → Image, file URLs → Video.
 */
export type StreamType = 'hls' | 'mjpeg' | 'webrtc' | 'video' | 'unknown';

export function detectStreamType(url: string): StreamType {
  const trimmed = url.trim();
  if (!trimmed) return 'unknown';

  const u = trimmed.toLowerCase();

  if (u.includes('.m3u8') || u.includes('application/x-mpegurl') || u.includes('/index.m3u8')) {
    return 'hls';
  }

  if (
    u.includes('/mjpeg') ||
    u.includes('/mjpg') ||
    u.includes('motionjpeg') ||
    u.includes('multipart/x-mixed-replace') ||
    u.includes('cgi-bin/mjpg')
  ) {
    return 'mjpeg';
  }

  if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.endsWith('.mkv')) {
    return 'video';
  }

  if (trimmed.startsWith('rtsp://') || trimmed.startsWith('rtsps://')) {
    return 'unknown';
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('file:')) {
    if (u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.endsWith('.mkv')) {
      return 'video';
    }
    return 'video';
  }

  if (trimmed.startsWith('http')) {
    const portMatch = trimmed.match(/https?:\/\/[^/:]+:(\d+)/i);
    const port = portMatch ? Number(portMatch[1]) : null;
    if (port === 8889 || port === 8888 || port === 1935) {
      if (!u.includes('.m3u8')) return 'webrtc';
    }
    if (u.includes('webrtc') || u.includes('whip') || u.includes('whep')) {
      return 'webrtc';
    }
    // Plain HTTPS HLS without ".m3u8" in path (some CDNs) — still try HLS if path suggests playlist
    if (u.includes('hls') && (u.includes('playlist') || u.includes('manifest'))) {
      return 'hls';
    }
    // Default: treat as embed / MediaMTX web player (same as web iframe branch)
    return 'webrtc';
  }

  return 'unknown';
}
