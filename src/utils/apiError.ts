import { isAxiosError } from 'axios';

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v.join(', ');
  return undefined;
}

/** Best-effort message from API error bodies (Nest, Spring, plain string, etc.). */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    const d = error.response?.data as Record<string, unknown> | string | undefined;
    if (typeof d === 'string' && d.trim()) return d;
    if (d && typeof d === 'object') {
      const msg =
        asString(d.message) ??
        asString(d.error) ??
        asString(d.detail) ??
        (typeof d.errors === 'object' ? JSON.stringify(d.errors) : undefined);
      if (msg) return msg;
    }
    if (error.response?.status) {
      return `${fallback} (${error.response.status})`;
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const host = error.config?.baseURL ?? 'server';
      return `Cannot reach ${host}. Check your internet connection or server status.`;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
