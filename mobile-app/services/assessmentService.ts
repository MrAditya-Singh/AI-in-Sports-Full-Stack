/**
 * ATHLETIX — Assessment Service (Phase 4/5)
 * services/assessmentService.ts
 *
 * Fetches AI performance reports, score breakdowns, strengths, and coaching suggestions.
 */

import api from './api';
import { AssessmentRecord } from './videoService';
export type { AssessmentRecord };

/** Fetches all completed AI assessment reports for athlete */
export async function getMyAssessments(): Promise<AssessmentRecord[]> {
  const response = await api.get('/assessments');
  return response.data.data || [];
}

/** Fetches the latest completed AI assessment for athlete dashboard */
export async function getLatestAssessment(): Promise<AssessmentRecord | null> {
  const response = await api.get('/assessments/latest');
  return response.data.data;
}

/** Fetches single detailed assessment report */
export async function getAssessmentDetail(assessmentId: string): Promise<AssessmentRecord> {
  const response = await api.get(`/assessments/${assessmentId}`);
  return response.data.data;
}
