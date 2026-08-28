/**
 * ATHLETIX — Live AI Posture Coach Service
 * services/liveCoachService.ts
 *
 * Integrates single-sign-on launch URL generation and live session persistence.
 */

import api from './api';

export interface LiveLaunchData {
  launch_url: string;
  username: string;
  service_status: string;
}

/** Fetches single-sign-on launch URL for ai-gym-coach-main - Copy */
export async function getLiveLaunchUrl(): Promise<LiveLaunchData> {
  const response = await api.get('/live/launch-url');
  return response.data.data;
}

/** Logs a completed live posture session */
export async function logLiveSession(payload: {
  exercise_name: string;
  sets_completed: number;
  total_reps: number;
  duration_seconds: number;
  accuracy_score?: number;
}): Promise<{ message: string; summary: any }> {
  const response = await api.post('/live/session', payload);
  return response.data.data;
}
