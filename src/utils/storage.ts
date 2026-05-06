import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same logical keys as your web `localStorage` (AsyncStorage is async). */
export const SESSION_KEYS = {
  token: 'token',
  refreshToken: 'refreshToken',
  refreshTokenTime: 'refreshTokenTime',
  organizationId: 'organizationId',
  mediaProcessingType: 'mediaProcessingType',
  userId: 'userId',
  isEditPermission: 'isEditPermission',
} as const;

const LEGACY_TOKEN = '@vg360/auth_token';
const LEGACY_REFRESH = '@vg360/auth_refresh';

export async function setStorage(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getStorage(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

/** Persists login `response` fields (same as web `setStorage` calls). */
export async function persistLoginResponse(raw: unknown): Promise<void> {
  if (!raw || typeof raw !== 'object') return;
  const res = (raw as Record<string, unknown>).response;
  if (!res || typeof res !== 'object') return;

  const r = res as Record<string, unknown>;
  const org =
    r.organization && typeof r.organization === 'object'
      ? (r.organization as Record<string, unknown>)
      : null;

  const entries: [string, string][] = [];

  if (typeof r.accessToken === 'string' && r.accessToken) {
    entries.push([SESSION_KEYS.token, r.accessToken]);
  }
  if (typeof r.refreshToken === 'string' && r.refreshToken) {
    entries.push([SESSION_KEYS.refreshToken, r.refreshToken]);
  }

  entries.push([SESSION_KEYS.refreshTokenTime, String(Date.now())]);

  if (org?.id != null && org.id !== '') {
    entries.push([SESSION_KEYS.organizationId, String(org.id)]);
  }
  if (org?.mediaProcessingType != null && String(org.mediaProcessingType) !== '') {
    entries.push([SESSION_KEYS.mediaProcessingType, String(org.mediaProcessingType)]);
  }
  if (r.userId != null && String(r.userId) !== '') {
    entries.push([SESSION_KEYS.userId, String(r.userId)]);
  }
  if (typeof r.canModify === 'boolean') {
    entries.push([SESSION_KEYS.isEditPermission, r.canModify ? 'true' : 'false']);
  }

  if (entries.length > 0) {
    await AsyncStorage.multiSet(entries);
  }
}

export async function getAuthToken(): Promise<string | null> {
  const t = await AsyncStorage.getItem(SESSION_KEYS.token);
  if (t) return t;
  return AsyncStorage.getItem(LEGACY_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  const t = await AsyncStorage.getItem(SESSION_KEYS.refreshToken);
  if (t) return t;
  return AsyncStorage.getItem(LEGACY_REFRESH);
}

/** Clears all locally persisted app storage on logout. */
export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.clear();
}
