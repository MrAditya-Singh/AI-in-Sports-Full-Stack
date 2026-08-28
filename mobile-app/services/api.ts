/**
 * ATHLETIX — API Service (Axios Instance)
 * services/api.ts
 *
 * Single Axios instance used by all service files.
 * - Stored JWT automatically Bearer token ke roop me inject hota hai.
 * - JSON aur FormData/video upload dono support karta hai.
 * - Backend errors ko user-friendly messages me normalize karta hai.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
} from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration ────────────────────────────────────────────────────────────

function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    ) {
      return `http://${host}:8000/api/v1`;
    }
  }

  return 'http://127.0.0.1:8000/api/v1';
}

const BASE_URL = resolveBaseUrl();


// AsyncStorage key authService.ts wali key se exactly match honi chahiye.
const TOKEN_KEY = 'athletix_access_token';

// ─── Error response types ─────────────────────────────────────────────────────

// ✅ CHANGED:
// AxiosError<any> ke badle structured error type.
interface BackendErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };

  detail?:
  | string
  | {
    error?: {
      code?: string;
      message?: string;
    };
    message?: string;
  };

  message?: string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,

  // ✅ CHANGED:
  // Video upload aur AI processing requests ke liye 30 seconds kam ho sakte hain.
  timeout: 120_000,

  /**
   * ✅ CHANGED:
   * Global "Content-Type: application/json" remove kiya hai.
   *
   * Reason:
   * - JSON request par Axios automatically application/json set karega.
   * - FormData/video upload par Axios automatically correct
   *   multipart/form-data boundary generate karega.
   *
   * Global JSON header video upload ko break kar sakta tha.
   */
});

// ─── Request interceptor: inject stored JWT ───────────────────────────────────

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error: unknown) => Promise.reject(error)
);

// ─── Response interceptor: normalize errors ───────────────────────────────────

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError<BackendErrorPayload>) => {
    const serverData = error.response?.data;
    const detail = serverData?.detail;

    // Backend ke supported error response formats.
    const serverMessage =
      serverData?.error?.message ??
      (typeof detail === 'object'
        ? detail?.error?.message ?? detail?.message
        : undefined) ??
      (typeof detail === 'string'
        ? detail
        : undefined) ??
      serverData?.message;

    // ✅ CHANGED:
    // Timeout, network failure aur backend messages alag handle honge.
    let userMessage: string;

    if (serverMessage) {
      userMessage = serverMessage;
    } else if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    ) {
      userMessage =
        'Request timed out. Please check your connection and try again.';
    } else if (
      error.code === 'ERR_NETWORK' ||
      !error.response
    ) {
      userMessage =
        'Unable to connect to the server. Check that the backend is running and the API URL is correct.';
    } else if (error.response.status >= 500) {
      userMessage =
        'Server error occurred. Please try again after some time.';
    } else if (error.response.status === 401) {
      userMessage =
        'Invalid credentials or your session has expired.';

      // Token expiration on protected route -> auto session cleanup
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        void AsyncStorage.multiRemove([TOKEN_KEY, 'athletix_user']).then(() => {
          try {
            const { useAuthStore } = require('../stores/useAuthStore');
            useAuthStore.getState().setUser(null);
          } catch {
            // Ignore if store not ready
          }
        });
      }
    } else if (error.response.status === 403) {
      userMessage =
        'You are not authorized to perform this action.';
    } else if (error.response.status === 404) {
      userMessage =
        'The requested resource was not found.';
    } else {
      userMessage =
        'Something went wrong. Please try again.';
    }

    /**
     * ✅ CHANGED:
     * Existing UI error.userMessage access karti hai, isliye custom
     * property preserve ki gayi hai.
     */
    (
      error as AxiosError<BackendErrorPayload> & {
        userMessage: string;
      }
    ).userMessage = userMessage;

    return Promise.reject(error);
  }
);

export default api;