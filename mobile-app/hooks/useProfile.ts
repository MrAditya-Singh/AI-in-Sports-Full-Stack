/**
 * ATHLETIX — useProfile Hook (Phase 2)
 * hooks/useProfile.ts
 *
 * Manages profile state, onboarding progress, loading state,
 * and save handlers for the logged-in athlete.
 */

import { useCallback, useEffect, useState } from 'react';
import { getMyProfile, updateAthleteProfile, updateCoreProfile, UserProfile, AthleteProfileData } from '../services/userService';

export interface UseProfileReturn {
  profile:             UserProfile | null;
  completenessPercent: number;
  isLoading:           boolean;
  isSaving:            boolean;
  error:               string | null;
  reloadProfile:       () => Promise<void>;
  saveProfile:         (name: string, athleteData: AthleteProfileData) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [isLoading, setLoading]   = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err?.userMessage ?? 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (name: string, athleteData: AthleteProfileData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      if (name.trim() && name !== profile?.name) {
        await updateCoreProfile(name.trim());
      }
      await updateAthleteProfile(athleteData);
      await load(); // Reload updated profile
      return true;
    } catch (err: any) {
      setError(err?.userMessage ?? 'Failed to save profile changes.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    completenessPercent: profile?.completeness_percent ?? 20,
    isLoading,
    isSaving,
    error,
    reloadProfile: load,
    saveProfile,
  };
}
