import { getAuthToken } from '@/utils/authState';

export function authHeaders(headers?: Record<string, string>) {
  const token = getAuthToken();
  if (typeof window !== 'undefined' && !token) {
    console.warn('[auth] request without token');
  }
  return token ? { ...(headers || {}), Authorization: `Bearer ${token}` } : headers;
}
