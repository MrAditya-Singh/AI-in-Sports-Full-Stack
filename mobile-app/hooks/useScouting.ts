/**
 * ATHLETIX — useScouting Hook
 * hooks/useScouting.ts
 *
 * Manages:
 * - Official shortlist state
 * - Sport-specific shortlist status
 * - Shortlist add/remove actions
 * - Official performance verifications
 */

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  addToShortlist,
  getMyShortlist,
  getMyVerifications,
  removeFromShortlist,
  verifyPerformance,
  type ScoutingSport,
  type ShortlistItem,
  type VerificationItem,
} from '../services/scoutingService';

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error !== 'object' ||
    error === null
  ) {
    return fallback;
  }

  const value = error as {
    userMessage?: string;
    message?: string;
  };

  return (
    value.userMessage ??
    value.message ??
    fallback
  );
}

export function useScouting() {
  const [shortlist, setShortlist] =
    useState<ShortlistItem[]>([]);

  const [verifications, setVerifications] =
    useState<VerificationItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Loads shortlist and verification data.
   */
  const load = useCallback(
    async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      const [
        shortlistResult,
        verificationResult,
      ] = await Promise.allSettled([
        getMyShortlist(),
        getMyVerifications(),
      ]);

      if (
        shortlistResult.status === 'fulfilled'
      ) {
        setShortlist(shortlistResult.value);
      } else {
        setShortlist([]);

        setError(
          getErrorMessage(
            shortlistResult.reason,
            'Could not load shortlist.',
          ),
        );
      }

      if (
        verificationResult.status === 'fulfilled'
      ) {
        setVerifications(
          verificationResult.value,
        );
      } else {
        setVerifications([]);

        setError((currentError) =>
          currentError ??
          getErrorMessage(
            verificationResult.reason,
            'Could not load verifications.',
          ),
        );
      }

      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Checks athlete shortlist status.
   *
   * When sport is supplied, exact athlete + sport
   * combination is checked.
   */
  const isShortlisted = useCallback(
    (
      athleteId: string,
      sport?: ScoutingSport,
    ): boolean => {
      return shortlist.some((item) => {
        if (item.athlete_id !== athleteId) {
          return false;
        }

        if (sport) {
          return item.sport === sport;
        }

        return true;
      });
    },
    [shortlist],
  );

  /**
   * Checks whether a video was verified.
   */
  const isVerified = useCallback(
    (videoId: string): boolean => {
      return verifications.some(
        (item) => item.video_id === videoId,
      );
    },
    [verifications],
  );

  /**
   * Adds or removes an exact athlete + sport
   * shortlist combination.
   */
  const toggleShortlist = useCallback(
    async (
      athleteId: string,
      sport: ScoutingSport,
    ): Promise<void> => {
      setActionLoadingId(athleteId);
      setError(null);

      const alreadyShortlisted =
        shortlist.some(
          (item) =>
            item.athlete_id === athleteId &&
            item.sport === sport,
        );

      try {
        if (alreadyShortlisted) {
          await removeFromShortlist(
            athleteId,
            sport,
          );

          // Immediate frontend status update.
          setShortlist((currentShortlist) =>
            currentShortlist.filter(
              (item) =>
                !(
                  item.athlete_id === athleteId &&
                  item.sport === sport
                ),
            ),
          );
        } else {
          const result = await addToShortlist(
            athleteId,
            sport,
          );

          setShortlist((currentShortlist) => {
            const exists =
              currentShortlist.some(
                (item) =>
                  item.athlete_id === athleteId &&
                  item.sport === sport,
              );

            if (exists) {
              return currentShortlist;
            }

            return [
              result.shortlist,
              ...currentShortlist,
            ];
          });
        }

        // Reload enriched athlete profile data.
        await load();
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            'Could not update shortlist.',
          ),
        );

        throw caughtError;
      } finally {
        setActionLoadingId(null);
      }
    },
    [load, shortlist],
  );

  /**
   * Removes an athlete from one selected sport.
   * Used by the shortlist-management screen.
   */
  const removeShortlistedAthlete =
    useCallback(
      async (
        athleteId: string,
        sport: ScoutingSport,
      ): Promise<void> => {
        setActionLoadingId(athleteId);
        setError(null);

        try {
          await removeFromShortlist(
            athleteId,
            sport,
          );

          setShortlist((currentShortlist) =>
            currentShortlist.filter(
              (item) =>
                !(
                  item.athlete_id === athleteId &&
                  item.sport === sport
                ),
            ),
          );
        } catch (caughtError: unknown) {
          setError(
            getErrorMessage(
              caughtError,
              'Could not remove athlete.',
            ),
          );

          throw caughtError;
        } finally {
          setActionLoadingId(null);
        }
      },
      [],
    );

  /**
   * Verifies one athlete video.
   */
  const verifyAthlete = useCallback(
    async (
      athleteId: string,
      videoId: string,
      exercise: string,
    ): Promise<void> => {
      setActionLoadingId(videoId);
      setError(null);

      try {
        await verifyPerformance(
          athleteId,
          videoId,
          exercise,
        );

        await load();
      } catch (caughtError: unknown) {
        setError(
          getErrorMessage(
            caughtError,
            'Could not verify athlete.',
          ),
        );

        throw caughtError;
      } finally {
        setActionLoadingId(null);
      }
    },
    [load],
  );

  return {
    shortlist,
    verifications,

    isLoading,
    actionLoadingId,
    error,

    isShortlisted,
    isVerified,

    toggleShortlist,
    removeShortlistedAthlete,
    verifyAthlete,

    refreshScouting: load,
  };
}