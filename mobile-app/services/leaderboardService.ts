/**
 * ATHLETIX — Leaderboard Service
 * services/leaderboardService.ts
 */

import api from './api';

export interface LeaderboardItem {
  sport: string;
  exercise: string;
  athlete_id: string;
  athlete_name: string;
  athlete_location: string | null;
  score: number;
  rep_count: number | null;
  assessed_at: string;
  rank: number;
  is_verified: boolean;
}

export interface MyRanking {
  is_ranked: boolean;
  rank: number | null;
  entry: LeaderboardItem | null;
  total_ranked: number;
  sport: string;
  exercise: string;
}

export type LeaderboardSport =
  | 'global'
  | 'all'
  | 'powerlifting'
  | 'calisthenics'
  | string;

function normalizeFilter(value?: string): string | undefined {
  if (!value) return undefined;

  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  if (!cleaned || cleaned === 'all' || cleaned === 'global') {
    return undefined;
  }

  return cleaned;
}

function normalizeItem(raw: any): LeaderboardItem {
  const score = Number(raw?.score);
  const rank = Number(raw?.rank);
  const reps = Number(raw?.rep_count);

  return {
    sport: typeof raw?.sport === 'string' ? raw.sport : '',
    exercise: typeof raw?.exercise === 'string' ? raw.exercise : '',
    athlete_id: typeof raw?.athlete_id === 'string' ? raw.athlete_id : '',
    athlete_name:
      typeof raw?.athlete_name === 'string' && raw.athlete_name.trim()
        ? raw.athlete_name
        : 'Athlete',
    athlete_location:
      typeof raw?.athlete_location === 'string' &&
      raw.athlete_location.trim()
        ? raw.athlete_location
        : null,
    score: Number.isFinite(score) ? score : 0,
    rep_count:
      raw?.rep_count === null ||
      raw?.rep_count === undefined ||
      !Number.isFinite(reps)
        ? null
        : reps,
    assessed_at:
      typeof raw?.assessed_at === 'string'
        ? raw.assessed_at
        : '',
    rank: Number.isFinite(rank) ? rank : 0,
    is_verified: raw?.is_verified === true,
  };
}

export async function getLeaderboard(
  sport?: LeaderboardSport,
  exercise?: string,
  limit: number = 50,
): Promise<LeaderboardItem[]> {
  const params: Record<string, string | number> = {
    limit: Math.min(100, Math.max(1, Math.trunc(limit))),
  };

  const sportFilter = normalizeFilter(sport);
  const exerciseFilter = normalizeFilter(exercise);

  if (sportFilter) params.sport = sportFilter;
  if (exerciseFilter) params.exercise = exerciseFilter;

  const response = await api.get('/leaderboard', { params });
  const data = response.data?.data;

  if (!Array.isArray(data)) return [];

  return data
    .map(normalizeItem)
    .filter((item) => Boolean(item.athlete_id));
}

export async function getMyRanking(
  sport?: LeaderboardSport,
  exercise?: string,
): Promise<MyRanking> {
  const params: Record<string, string> = {};

  const sportFilter = normalizeFilter(sport);
  const exerciseFilter = normalizeFilter(exercise);

  if (sportFilter) params.sport = sportFilter;
  if (exerciseFilter) params.exercise = exerciseFilter;

  const response = await api.get('/leaderboard/me', { params });
  const data = response.data?.data ?? {};

  const entry = data.entry ? normalizeItem(data.entry) : null;
  const rank = Number(data.rank);
  const totalRanked = Number(data.total_ranked);

  return {
    is_ranked: data.is_ranked === true && entry !== null,
    rank:
      data.rank === null ||
      data.rank === undefined ||
      !Number.isFinite(rank)
        ? null
        : rank,
    entry,
    total_ranked: Number.isFinite(totalRanked) ? totalRanked : 0,
    sport:
      typeof data.sport === 'string'
        ? data.sport
        : sportFilter ?? 'global',
    exercise:
      typeof data.exercise === 'string'
        ? data.exercise
        : exerciseFilter ?? 'all',
  };
}