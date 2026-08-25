/**
 * ATHLETIX — useLeaderboard Custom Hook (Phase 6)
 * hooks/useLeaderboard.ts
 *
 * Manages leaderboard filtering by sport & exercise, top 3 podium items,
 * and refreshing data.
 */

import { useCallback, useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardItem } from '../services/leaderboardService';
import { Sport, Exercise } from '../constants/sports';

export function useLeaderboard() {
  const [selectedSport, setSelectedSport]     = useState<Sport>('powerlifting');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | 'all'>('all');

  const [items, setItems]         = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const exParam = selectedExercise === 'all' ? undefined : selectedExercise;
      const data = await getLeaderboard(selectedSport, exParam);
      setItems(data);
    } catch (err: any) {
      setError(err?.userMessage ?? 'Could not load leaderboard.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSport, selectedExercise]);

  useEffect(() => {
    load();
  }, [load]);

  const topThree = items.slice(0, 3);
  const remainingItems = items.slice(3);

  return {
    selectedSport,
    setSelectedSport,
    selectedExercise,
    setSelectedExercise,
    items,
    topThree,
    remainingItems,
    isLoading,
    error,
    refreshLeaderboard: load,
  };
}
