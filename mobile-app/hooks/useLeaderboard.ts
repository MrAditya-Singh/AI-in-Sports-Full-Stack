/**
 * ATHLETIX — useLeaderboard Hook
 * hooks/useLeaderboard.ts
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getLeaderboard,
  getMyRanking,
  LeaderboardItem,
  MyRanking,
} from '../services/leaderboardService';

import { Exercise, Sport } from '../constants/sports';
import { useAuth } from './useAuth';

export type LeaderboardSportFilter = Sport | 'global';
export type LeaderboardExerciseFilter = Exercise | 'all';

export function useLeaderboard() {
  const { userId } = useAuth();

  const [selectedSport, setSelectedSportState] =
    useState<LeaderboardSportFilter>('global');

  const [selectedExercise, setSelectedExerciseState] =
    useState<LeaderboardExerciseFilter>('all');

  const [items, setItems] =
    useState<LeaderboardItem[]>([]);

  const [myRanking, setMyRanking] =
    useState<MyRanking | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (refreshOnly: boolean = false) => {
      const requestId = ++requestIdRef.current;

      if (refreshOnly) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      const sportParam =
        selectedSport === 'global'
          ? undefined
          : selectedSport;

      const exerciseParam =
        selectedExercise === 'all'
          ? undefined
          : selectedExercise;

      try {
        const [listResult, rankResult] =
          await Promise.allSettled([
            getLeaderboard(
              sportParam,
              exerciseParam,
              50,
            ),
            getMyRanking(
              sportParam,
              exerciseParam,
            ),
          ]);

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (listResult.status === 'rejected') {
          throw listResult.reason;
        }

        setItems(listResult.value);

        // Expired JWT should not hide public leaderboard.
        if (rankResult.status === 'fulfilled') {
          setMyRanking(rankResult.value);
        } else {
          setMyRanking(null);
        }
      } catch (err: any) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setItems([]);
        setMyRanking(null);

        setError(
          err?.userMessage ??
          err?.message ??
          'Could not load leaderboard.',
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [selectedSport, selectedExercise],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const setSelectedSport = useCallback(
    (sport: LeaderboardSportFilter) => {
      setSelectedSportState(sport);
      setSelectedExerciseState('all');
    },
    [],
  );

  const setSelectedExercise = useCallback(
    (exercise: LeaderboardExerciseFilter) => {
      setSelectedExerciseState(exercise);
    },
    [],
  );

  const refreshLeaderboard = useCallback(
    async () => {
      await load(true);
    },
    [load],
  );

  const isOwnEntry = useCallback(
    (item: LeaderboardItem): boolean => {
      return Boolean(
        userId &&
        String(item.athlete_id) === String(userId),
      );
    },
    [userId],
  );

  const topThree = items.slice(0, 3);
  const remainingItems = items.slice(3);

  const ownEntry =
    items.find(isOwnEntry) ??
    myRanking?.entry ??
    null;

  const ownRank =
    ownEntry?.rank ??
    myRanking?.rank ??
    null;

  return {
    selectedSport,
    setSelectedSport,

    selectedExercise,
    setSelectedExercise,

    items,
    topThree,
    remainingItems,

    myRanking,
    ownEntry,
    ownRank,
    isOwnEntry,

    totalRanked:
      myRanking?.total_ranked ??
      items.length,

    isLoading,
    isRefreshing,
    error,

    refreshLeaderboard,
  };
}