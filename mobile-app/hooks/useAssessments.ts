/**
 * ATHLETIX — useAssessments Custom Hook (Phase 4/5)
 * hooks/useAssessments.ts
 *
 * Manages athlete's AI reports, score histories, strengths, weaknesses, and detail views.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getMyAssessments,
  getLatestAssessment,
  type AssessmentRecord,
} from '../services/assessmentService';

interface UserFacingError {
  userMessage?: string;
  message?: string;
}

export function useAssessments() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [latestAssessment, setLatestAssessment] =
    useState<AssessmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, latest] = await Promise.all([
        getMyAssessments(),
        getLatestAssessment(),
      ]);
      setAssessments(list);
      setLatestAssessment(latest);
    } catch (caughtError: unknown) {
      const err = caughtError as UserFacingError;
      setError(
        err.userMessage ?? err.message ?? 'Could not fetch assessment history.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssessments();
  }, [fetchAssessments]);

  return {
    assessments,
    latestAssessment,
    isLoading,
    error,
    refreshAssessments: fetchAssessments,
  };
}
