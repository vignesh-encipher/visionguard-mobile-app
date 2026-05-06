/**
 * Expo inlines only `EXPO_PUBLIC_*` at bundle time.
 * Falls back to `NEXT_PUBLIC_PORTAL_BASE_URL` if your .env still uses that name.
 */
const DEFAULT_API_BASE_URL = 'http://34.231.171.179:11080';

function stripQuotes(s: string): string {
  return s.replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

function normalizeBaseUrl(raw: string): string {
  let u = stripQuotes(raw);
  if (!u) return DEFAULT_API_BASE_URL;
  u = u.replace(/\/+$/, '');
  return u;
}

export function getApiBaseUrl(): string {
  const expo = process.env.EXPO_PUBLIC_API_BASE_URL;
  const legacy = process.env.NEXT_PUBLIC_PORTAL_BASE_URL;
  const url = normalizeBaseUrl(expo || legacy || '');
  if (__DEV__) {
    console.log('[env] API base URL =', url);
  }
  return url;
}
