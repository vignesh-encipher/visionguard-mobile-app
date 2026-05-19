const BASE64_KEYS = ['data', 'bytes', 'content', 'recording', 'video', 'frame', 'stream'] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stripDataUriPrefix(value: string): string {
  const comma = value.indexOf(',');
  if (value.startsWith('data:') && comma !== -1) {
    return value.slice(comma + 1).trim();
  }
  return value.trim();
}

function readBase64FromObject(obj: Record<string, unknown>): string | null {
  for (const key of BASE64_KEYS) {
    const v = obj[key];
    if (isNonEmptyString(v)) return stripDataUriPrefix(v);
  }
  return null;
}

/** Extract base64 video payload from a JSON API envelope. */
export function extractRecordingBase64(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  const top = body as Record<string, unknown>;
  if (typeof top.status === 'string' && top.status.toUpperCase() !== 'SUCCESS') {
    return null;
  }

  const direct = readBase64FromObject(top);
  if (direct) return direct;

  const res = top.response;
  if (isNonEmptyString(res)) return stripDataUriPrefix(res);
  if (res && typeof res === 'object') {
    return readBase64FromObject(res as Record<string, unknown>);
  }

  return null;
}
