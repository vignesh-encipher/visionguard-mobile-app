import type { LoginResponse } from './auth.types';

/** Merge nested envelopes: `data`, `response` (VisionGuard shape), then top-level. */
function mergePayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...r };

  const mergeInner = (inner: unknown) => {
    if (!inner || typeof inner !== 'object') return;
    for (const [k, v] of Object.entries(inner as Record<string, unknown>)) {
      if (out[k] === undefined) out[k] = v;
    }
  };

  mergeInner(r.data);
  mergeInner(r.response);
  return out;
}

/** Business failure on HTTP 200. */
export function getLoginFailureMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const top = body as Record<string, unknown>;

  if (top.success === false) {
    return String(top.message ?? top.error ?? 'Login failed');
  }

  const d = mergePayload(body);

  if (d.success === false) {
    return String(d.message ?? d.error ?? 'Login failed');
  }

  if (typeof d.status === 'string') {
    const s = d.status.toUpperCase();
    if (s === 'FAILURE' || s === 'FAILED' || s === 'ERROR') {
      return String(d.message ?? d.error ?? 'Login failed');
    }
  }

  if (d.status === 'error' || d.status === 'ERROR') {
    return String(d.message ?? d.error ?? 'Login failed');
  }

  if (typeof d.error === 'string' && d.error.trim()) return d.error.trim();

  return null;
}

export function extractLoginPayload(body: unknown): LoginResponse {
  const d = mergePayload(body);
  const userRaw = d.user;
  let user =
    userRaw && typeof userRaw === 'object'
      ? (userRaw as LoginResponse['user'])
      : undefined;

  if (!user && typeof d.userId === 'string') {
    user = { id: d.userId };
  }

  return {
    accessToken: (d.accessToken ?? d.access_token) as string | undefined,
    token: (d.token ?? d.jwt) as string | undefined,
    refreshToken: d.refreshToken as string | undefined,
    user,
    message: typeof d.message === 'string' ? d.message : undefined,
    success: typeof d.success === 'boolean' ? d.success : undefined,
  };
}

export function extractAccessToken(parsed: LoginResponse): string | undefined {
  return parsed.accessToken ?? parsed.token;
}
