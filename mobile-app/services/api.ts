/**
 * ATHLETIX — API Service (Axios Instance)
 * services/api.ts
 *
 * Single Axios instance used by ALL service files.
 * - Automatically injects the stored JWT Bearer token on every request
 * - Returns structured responses matching the backend contract
 * - Shows user-friendly error messages; never exposes raw error objects
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject stored JWT ───────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('athletix_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const serverData = error?.response?.data;
    const serverMessage =
      serverData?.error?.message ??
      serverData?.detail?.error?.message ??
      (typeof serverData?.detail === 'string' ? serverData.detail : undefined);

    const userMessage =
      serverMessage ??
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Check your connection.'
        : 'Something went wrong. Please try again.');
    // Attach human-readable message — UI uses this for toasts
    (error as any).userMessage = userMessage;
    return Promise.reject(error);
  },
);

export default api;
