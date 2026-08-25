/**
 * ATHLETIX — Official Scouting Service (Phase 6)
 * services/scoutingService.ts
 *
 * Verifications and Shortlist management for officials.
 */

import api from './api';
import { UserProfile } from './userService';

export interface VerificationItem {
  id:          string;
  official_id: string;
  athlete_id:  string;
  video_id:    string;
  exercise:    string;
  verified_at: string;
}

export interface ShortlistItem {
  id:          string;
  official_id: string;
  athlete_id:  string;
  sport:       string;
  created_at:  string;
  athlete?:    UserProfile;
}

/** Official verifies an athlete's video performance */
export async function verifyPerformance(athleteId: string, videoId: string, exercise: string): Promise<void> {
  await api.post('/verifications', {
    athlete_id: athleteId,
    video_id:   videoId,
    exercise,
  });
}

/** Official revokes a verification badge */
export async function revokeVerification(videoId: string): Promise<void> {
  await api.delete(`/verifications/${videoId}`);
}

/** Official fetches list of verifications issued */
export async function getMyVerifications(): Promise<VerificationItem[]> {
  const response = await api.get('/verifications/mine');
  return response.data.data || [];
}

/** Official adds athlete to talent shortlist */
export async function addToShortlist(athleteId: string, sport: 'powerlifting' | 'calisthenics'): Promise<void> {
  await api.post('/shortlists', {
    athlete_id: athleteId,
    sport,
  });
}

/** Official removes athlete from shortlist */
export async function removeFromShortlist(athleteId: string): Promise<void> {
  await api.delete(`/shortlists/${athleteId}`);
}

/** Official fetches their shortlisted athletes list */
export async function getMyShortlist(): Promise<ShortlistItem[]> {
  const response = await api.get('/shortlists/mine');
  return response.data.data || [];
}
