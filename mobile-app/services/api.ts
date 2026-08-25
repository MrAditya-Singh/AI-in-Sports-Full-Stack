/**
 * ATHLETIX — API Service (Axios Instance)
 * services/api.ts
 *
 * Single Axios instance used by ALL service files.
 * - Automatically injects the Supabase JWT Bearer token on every request
 * - Returns structured responses matching the backend contract
 * - Shows user-friendly error messages; never exposes raw error objects
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getAuthToken } from './authService';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,  // 30 s — generous for video status polling
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: inject auth token ────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: unwrap data or throw structured error ───────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const message =
      error?.response?.data?.error?.message ??
      'Something went wrong. Please try again.';
    // Attach human-readable message for UI toasts — never expose raw JSON
    error.userMessage = message;
    return Promise.reject(error);
  },
);

export default api;
