/**
 * ATHLETIX — Video Service
 * services/videoService.ts
 *
 * Web, Android and iOS compatible video upload service.
 */

import { Platform } from 'react-native';
import type { AxiosRequestConfig } from 'axios';

import api from './api';

export interface VideoRecord {
  id: string;
  athlete_id: string;
  sport: string;
  exercise: string;
  video_url: string;
  cloudinary_public_id?: string | null;
  duration_seconds: number;
  status:
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';
  error_msg?: string | null;
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

/**
 * Expo Web ke blob URL ko actual browser Blob mein convert karta hai.
 */
async function createWebVideoBlob(
  uri: string,
  mimeType: string,
): Promise<Blob> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      `Selected video could not be read (${response.status}).`,
    );
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('Selected video file is empty.');
  }

  if (!blob.type && mimeType) {
    return new Blob([blob], {
      type: mimeType,
    });
  }

  return blob;
}

/**
 * Uploads a video for AI analysis.
 */
export async function uploadVideoAttempt(
  payload: UploadVideoPayload,
  onProgress?: (percent: number) => void,
): Promise<{
  id: string;
  status: string;
  message: string;
}> {
  if (!payload.uri.trim()) {
    throw new Error('Please select a video file.');
  }

  if (!payload.sport.trim()) {
    throw new Error('Please select a sport.');
  }

  if (!payload.exercise.trim()) {
    throw new Error('Please select an exercise.');
  }

  const fileName =
    payload.name?.trim() || 'attempt.mp4';

  const mimeType =
    payload.type?.trim() || 'video/mp4';

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // ✅ CHANGED: Browser requires an actual Blob.
    const videoBlob = await createWebVideoBlob(
      payload.uri,
      mimeType,
    );

    formData.append(
      'file',
      videoBlob,
      fileName,
    );
  } else {
    // ✅ Android/iOS React Native format.
    formData.append(
      'file',
      {
        uri: payload.uri,
        name: fileName,
        type: mimeType,
      } as any,
    );
  }

  formData.append(
    'sport',
    payload.sport.trim().toLowerCase(),
  );

  formData.append(
    'exercise',
    payload.exercise.trim().toLowerCase(),
  );

  if (
    typeof payload.durationSeconds === 'number' &&
    payload.durationSeconds > 0
  ) {
    formData.append(
      'duration_seconds',
      String(payload.durationSeconds),
    );
  }

  const config: AxiosRequestConfig = {
    // ✅ Video/Cloudinary upload ke liye 3 minutes.
    timeout: 180_000,

    onUploadProgress: (progressEvent) => {
      if (
        !onProgress ||
        !progressEvent.total
      ) {
        return;
      }

      const percent = Math.min(
        100,
        Math.round(
          (progressEvent.loaded * 100) /
          progressEvent.total,
        ),
      );

      onProgress(percent);
    },
  };

  if (Platform.OS !== 'web') {
    // ✅ Native par multipart header required.
    config.headers = {
      'Content-Type': 'multipart/form-data',
    };
  }

  /*
   * ✅ Web par Content-Type manually set nahi karna.
   * Browser automatically multipart boundary add karega.
   */
  const response = await api.post(
    '/videos/upload',
    formData,
    config,
  );

  const data = response.data?.data;

  if (!data?.id) {
    throw new Error(
      'Backend returned an invalid video upload response.',
    );
  }

  return {
    id: String(data.id),
    status:
      typeof data.status === 'string'
        ? data.status
        : 'pending',
    message:
      typeof data.message === 'string'
        ? data.message
        : 'Video uploaded successfully.',
  };
}

/** Lists authenticated athlete videos. */
export async function getMyVideos():
  Promise<VideoRecord[]> {
  const response = await api.get('/videos');

  return Array.isArray(response.data?.data)
    ? response.data.data
    : [];
}

/** Gets one video with linked assessment. */
export async function getVideoDetail(
  videoId: string,
): Promise<VideoRecord> {
  if (!videoId.trim()) {
    throw new Error('Video ID is required.');
  }

  const response = await api.get(
    `/videos/${videoId}`,
  );

  return response.data.data;
}

/** Retries AI analysis. */
export async function retryVideoAnalysis(
  videoId: string,
): Promise<{
  message: string;
  video_id: string;
}> {
  if (!videoId.trim()) {
    throw new Error('Video ID is required.');
  }

  const response = await api.post(
    `/videos/${videoId}/retry`,
  );

  return response.data.data;
}

/** Deletes video and linked assessment. */
export async function deleteVideoAttempt(
  videoId: string,
): Promise<void> {
  if (!videoId.trim()) {
    throw new Error('Video ID is required.');
  }

  await api.delete(`/videos/${videoId}`);
}