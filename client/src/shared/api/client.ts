export class ApiError extends Error {
  public code?: string;
  public details?: any;
  public status: number;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const rawBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE = rawBaseUrl
  ? (rawBaseUrl.startsWith('http') ? rawBaseUrl.replace(/\/$/, '') : `https://${rawBaseUrl.replace(/\/$/, '')}`)
  : (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
      ? 'https://streakly-api-9cjr.onrender.com'
      : '');

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly cookies
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If access token expired, try to refresh once
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        // Retry original request
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        const retryData = await retryRes.json().catch(() => null);
        if (retryRes.ok) {
          return retryData?.data ?? retryData;
        }
      }
    }

    const errorMsg = data?.error?.message || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status, data?.error?.code, data?.error?.details);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}
