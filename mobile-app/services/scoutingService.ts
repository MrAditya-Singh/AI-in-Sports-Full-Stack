/**
 * ATHLETIX — Official Scouting Service
 * services/scoutingService.ts
 *
 * Handles:
 * - Official performance verifications
 * - Sport-specific athlete shortlisting
 * - Shortlist removal
 * - Shortlisted athlete retrieval
 */

import api from './api';

export type ScoutingSport =
  | 'powerlifting'
  | 'calisthenics';

export interface VerificationItem {
  id: string;
  official_id: string;
  athlete_id: string;
  video_id: string;
  exercise: string;
  verified_at: string;
}

export interface AthleteProfileSummary {
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  bio?: string | null;
  primary_sport?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  experience_level?: string | null;
}

export interface ShortlistedAthlete {
  id: string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  athlete_profile?: AthleteProfileSummary;
}

export interface ShortlistItem {
  id: string;
  official_id: string;
  athlete_id: string;
  sport: ScoutingSport;
  created_at: string;
  athlete?: ShortlistedAthlete;
}

export interface AddShortlistResult {
  created: boolean;
  message: string;
  shortlist: ShortlistItem;
}

function isScoutingSport(
  value: unknown,
): value is ScoutingSport {
  return (
    value === 'powerlifting' ||
    value === 'calisthenics'
  );
}

function normalizeVerification(
  raw: any,
): VerificationItem | null {
  if (
    typeof raw?.id !== 'string' ||
    typeof raw?.athlete_id !== 'string' ||
    typeof raw?.video_id !== 'string'
  ) {
    return null;
  }

  return {
    id: raw.id,
    official_id:
      typeof raw.official_id === 'string'
        ? raw.official_id
        : '',
    athlete_id: raw.athlete_id,
    video_id: raw.video_id,
    exercise:
      typeof raw.exercise === 'string'
        ? raw.exercise
        : '',
    verified_at:
      typeof raw.verified_at === 'string'
        ? raw.verified_at
        : '',
  };
}

function normalizeShortlist(
  raw: any,
): ShortlistItem | null {
  if (
    typeof raw?.id !== 'string' ||
    typeof raw?.athlete_id !== 'string' ||
    !isScoutingSport(raw?.sport)
  ) {
    return null;
  }

  const athlete =
    raw.athlete &&
      typeof raw.athlete === 'object'
      ? {
        id:
          typeof raw.athlete.id === 'string'
            ? raw.athlete.id
            : raw.athlete_id,

        name:
          typeof raw.athlete.name === 'string'
            ? raw.athlete.name
            : 'Athlete',

        email:
          typeof raw.athlete.email === 'string'
            ? raw.athlete.email
            : '',

        role:
          typeof raw.athlete.role === 'string'
            ? raw.athlete.role
            : undefined,

        created_at:
          typeof raw.athlete.created_at === 'string'
            ? raw.athlete.created_at
            : undefined,

        athlete_profile:
          raw.athlete.athlete_profile &&
            typeof raw.athlete.athlete_profile ===
            'object'
            ? raw.athlete.athlete_profile
            : {},
      }
      : undefined;

  return {
    id: raw.id,

    official_id:
      typeof raw.official_id === 'string'
        ? raw.official_id
        : '',

    athlete_id: raw.athlete_id,
    sport: raw.sport,

    created_at:
      typeof raw.created_at === 'string'
        ? raw.created_at
        : '',

    athlete,
  };
}

/** Official verifies an athlete's video performance. */
export async function verifyPerformance(
  athleteId: string,
  videoId: string,
  exercise: string,
): Promise<void> {
  if (!athleteId.trim()) {
    throw new Error('Athlete ID is required.');
  }

  if (!videoId.trim()) {
    throw new Error('Video ID is required.');
  }

  if (!exercise.trim()) {
    throw new Error('Exercise is required.');
  }

  await api.post('/verifications', {
    athlete_id: athleteId.trim(),
    video_id: videoId.trim(),
    exercise: exercise.trim(),
  });
}

/** Official revokes an issued verification. */
export async function revokeVerification(
  videoId: string,
): Promise<void> {
  if (!videoId.trim()) {
    throw new Error('Video ID is required.');
  }

  await api.delete(
    `/verifications/${videoId.trim()}`,
  );
}

/** Returns verifications issued by official. */
export async function getMyVerifications():
  Promise<VerificationItem[]> {
  const response = await api.get(
    '/verifications/mine',
  );

  const rows = response.data?.data;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(normalizeVerification)
    .filter(
      (item): item is VerificationItem =>
        item !== null,
    );
}

/**
 * Adds an athlete to one sport-specific shortlist.
 *
 * Repeated requests are idempotent on the backend.
 */
export async function addToShortlist(
  athleteId: string,
  sport: ScoutingSport,
): Promise<AddShortlistResult> {
  if (!athleteId.trim()) {
    throw new Error('Athlete ID is required.');
  }

  const response = await api.post(
    '/shortlists',
    {
      athlete_id: athleteId.trim(),
      sport,
    },
  );

  const data = response.data?.data;
  const shortlist = normalizeShortlist(
    data?.shortlist,
  );

  if (!shortlist) {
    throw new Error(
      'Backend returned an invalid shortlist response.',
    );
  }

  return {
    created: data?.created !== false,

    message:
      typeof data?.message === 'string'
        ? data.message
        : 'Athlete added to shortlist.',

    shortlist,
  };
}

/**
 * Removes only the selected athlete + sport combination.
 *
 * DELETE /shortlists/{athleteId}?sport=...
 */
export async function removeFromShortlist(
  athleteId: string,
  sport: ScoutingSport,
): Promise<void> {
  if (!athleteId.trim()) {
    throw new Error('Athlete ID is required.');
  }

  await api.delete(
    `/shortlists/${athleteId.trim()}`,
    {
      params: {
        sport,
      },
    },
  );
}

/** Returns authenticated official's shortlisted athletes. */
export async function getMyShortlist():
  Promise<ShortlistItem[]> {
  const response = await api.get(
    '/shortlists/mine',
  );

  const rows = response.data?.data;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(normalizeShortlist)
    .filter(
      (item): item is ShortlistItem =>
        item !== null,
    );
}