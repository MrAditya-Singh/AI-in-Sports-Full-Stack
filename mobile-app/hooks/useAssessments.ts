/**
 * ATHLETIX — useAssessments Custom Hook (Phase 4/5)
 * hooks/useAssessments.ts
 *
 * Manages athlete's AI reports, score histories, strengths, weaknesses, and detail views.
 */

import { useState, useCallback, useEffect } from 'react';
import { getMyAssessments, getLatestAssessment, AssessmentRecord } from '../services/assessmentService';

export function useAssessments() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    try {
      const [list, latest] = await Promise.all([
        getMyAssessments(),
        getLatestAssessment(),
      ]);
      setAssessments(list);
      setLatestAssessment(latest);
    } catch (err: any) {
      setError(err?.userMessage || 'Could not fetch assessments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  return {
    assessments,
    latestAssessment,
    isLoading,
    error,
    refreshAssessments: fetchAssessments,
  };
}
