/**
 * Centralized Axios API client with JWT interceptors
 */

// const API_BASE_URL = '/api';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Token storage
let accessToken: string | null = localStorage.getItem('accessToken');

// Event for auth state changes
const authChangeEvent = new Event('authChange');

/**
 * Set the access token
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
  window.dispatchEvent(authChangeEvent);
};

/**
 * Get the current access token
 */
export const getAccessToken = () => accessToken;

/**
 * Core fetch wrapper with auth headers and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to JSON if body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && accessToken) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new ApiError(retryResponse.status, errorData.message || 'Request failed');
      }

      return retryResponse.json();
    } else {
      // Refresh failed - logout
      setAccessToken(null);
      localStorage.removeItem('user');
      window.dispatchEvent(authChangeEvent);
      throw new ApiError(401, 'Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'Request failed', errorData.errors);
  }

  return response.json();
}

/**
 * Try to refresh the access token using the refresh token cookie
 */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Custom API Error
 */
export class ApiError extends Error {
  status: number;
  errors: any[];

  constructor(status: number, message: string, errors: any[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),

  post: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }),

  put: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }),

  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};

export default api;
