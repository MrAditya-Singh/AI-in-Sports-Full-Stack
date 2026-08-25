/**
 * ATHLETIX — Leaderboard Service (Phase 6)
 * services/leaderboardService.ts
 *
 * Fetches ranked athletes from backend leaderboard_view.
 */

import api from './api';

export interface LeaderboardItem {
  sport:            string;
  exercise:         string;
  athlete_id:       string;
  athlete_name:     string;
  athlete_location: string | null;
  score:            number;
  rep_count:        number | null;
  assessed_at:      string;
  rank:             number;
  is_verified:      boolean;
}

export async function getLeaderboard(
  sport?: 'powerlifting' | 'calisthenics',
  exercise?: string,
): Promise<LeaderboardItem[]> {
  const params: Record<string, string> = {};
  if (sport)    params.sport    = sport;
  if (exercise) params.exercise = exercise;

  const response = await api.get('/leaderboard', { params });
  return response.data.data || [];
}
