/**
 * ATHLETIX — Video Service (Phase 3)
 * services/videoService.ts
 *
 * Handles video upload (multipart), video history retrieval, and status tracking.
 */

import api from './api';

export interface VideoRecord {
  id: string;
  athlete_id: string;
  sport: string;
  exercise: string;
  video_url: string;
  cloudinary_public_id?: string;
  duration_seconds: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_msg?: string;
  uploaded_at: string;
  assessments?: AssessmentRecord[];
}

export interface AssessmentRecord {
  id: string;
  video_id: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  rep_count?: number | null;
  created_at: string;
  videos?: VideoRecord;
}

export interface UploadVideoPayload {
  uri: string;
  name: string;
  type: string;
  sport: string;
  exercise: string;
  durationSeconds?: number;
}

/** Uploads a video file for AI analysis */
export async function uploadVideoAttempt(
  payload: UploadVideoPayload,
  onProgress?: (percent: number) => void,
): Promise<{ id: string; status: string; message: string }> {
  const formData = new FormData();

  // React Native file upload format
  formData.append('file', {
    uri: payload.uri,
    name: payload.name || 'attempt.mp4',
    type: payload.type || 'video/mp4',
  } as any);

  formData.append('sport', payload.sport);
  formData.append('exercise', payload.exercise);
  if (payload.durationSeconds) {
    formData.append('duration_seconds', String(payload.durationSeconds));
  }

  const response = await api.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data.data;
}

/** Lists authenticated athlete's submitted videos */
export async function getMyVideos(): Promise<VideoRecord[]> {
  const response = await api.get('/videos');
  return response.data.data || [];
}

/** Gets single video details with linked assessment */
export async function getVideoDetail(videoId: string): Promise<VideoRecord> {
  const response = await api.get(`/videos/${videoId}`);
  return response.data.data;
}
