/**
 * ATHLETIX — useScouting Custom Hook (Phase 6)
 * hooks/useScouting.ts
 *
 * Manages official's shortlist state, verifications, and action toggles.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  addToShortlist,
  getMyShortlist,
  getMyVerifications,
  removeFromShortlist,
  verifyPerformance,
  ShortlistItem,
  VerificationItem,
} from '../services/scoutingService';

export function useScouting() {
  const [shortlist, setShortlist]         = useState<ShortlistItem[]>([]);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sl, ver] = await Promise.all([
        getMyShortlist().catch(() => []),
        getMyVerifications().catch(() => []),
      ]);
      setShortlist(sl);
      setVerifications(ver);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isShortlisted = (athleteId: string) => {
    return shortlist.some((item) => item.athlete_id === athleteId);
  };

  const isVerified = (videoId: string) => {
    return verifications.some((item) => item.video_id === videoId);
  };

  const toggleShortlist = async (athleteId: string, sport: 'powerlifting' | 'calisthenics') => {
    setActionLoadingId(athleteId);
    try {
      if (isShortlisted(athleteId)) {
        await removeFromShortlist(athleteId);
      } else {
        await addToShortlist(athleteId, sport);
      }
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const verifyAthlete = async (athleteId: string, videoId: string, exercise: string) => {
    setActionLoadingId(videoId);
    try {
      await verifyPerformance(athleteId, videoId, exercise);
      await load();
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    shortlist,
    verifications,
    isLoading,
    actionLoadingId,
    isShortlisted,
    isVerified,
    toggleShortlist,
    verifyAthlete,
    refreshScouting: load,
  };
}
