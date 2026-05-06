import axios from 'axios';
import { getApiBaseUrl } from '../../config/env';
import { getAuthToken } from '../../utils/storage';

const baseURL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL,
  timeout: 25000,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (__DEV__) {
      const url = `${error?.config?.baseURL ?? ''}${error?.config?.url ?? ''}`;
      console.warn('[api] request failed:', error?.message, '->', url);
    }
    return Promise.reject(error);
  },
);
