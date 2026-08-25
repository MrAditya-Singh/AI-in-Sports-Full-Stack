/**
 * ATHLETIX — User & Profile Service (Phase 2)
 * services/userService.ts
 *
 * API calls for fetching and updating user profiles, athlete onboarding details,
 * and scouting profile lookups.
 */

import api from './api';

export interface AthleteProfileData {
  age?:              number;
  gender?:           'Male' | 'Female' | 'Other' | 'Prefer not to say';
  location?:         string;
  bio?:              string;
  primary_sport?:    'powerlifting' | 'calisthenics';
  height_cm?:        number;
  weight_kg?:        number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

export interface UserProfile {
  id:                    string;
  name:                  string;
  email:                 string;
  role:                  'athlete' | 'official' | 'admin';
  created_at:            string;
  athlete_profile?:      AthleteProfileData;
  completeness_percent?: number;
}

/** Fetches full user profile (including athlete_profile & completeness_percent) */
export async function getMyProfile(): Promise<UserProfile> {
  const response = await api.get('/users/me');
  return response.data.data;
}

/** Updates user's display name */
export async function updateCoreProfile(name: string): Promise<void> {
  await api.put('/users/me', { name });
}

/** Upserts extended athlete onboarding profile fields */
export async function updateAthleteProfile(payload: AthleteProfileData): Promise<void> {
  await api.put('/users/me/athlete', payload);
}

/** Fetches public athlete profile by ID for officials/scouts */
export async function getAthleteProfileById(athleteId: string): Promise<UserProfile> {
  const response = await api.get(`/users/athlete/${athleteId}`);
  return response.data.data;
}
