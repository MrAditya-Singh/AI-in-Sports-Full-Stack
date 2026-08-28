/**
 * ATHLETIX — useVideos Custom Hook (Phase 3/4)
 * hooks/useVideos.ts
 *
 * Manages video uploads, upload progress, polling for AI pipeline completion,
 * retry logic, deletion, and athlete's video submission history.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getMyVideos,
  uploadVideoAttempt,
  retryVideoAnalysis,
  deleteVideoAttempt,
  type VideoRecord,
  type UploadVideoPayload,
} from '../services/videoService';

interface UserFacingError {
  userMessage?: string;
  message?: string;
}

export function useVideos() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await getMyVideos();
      setVideos(data);
    } catch (caughtError: unknown) {
      const vError = caughtError as UserFacingError;
      setError(
        vError.userMessage ?? vError.message ?? 'Could not fetch videos.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  // Poll every 3.5s if any video is pending/processing to update status live
  useEffect(() => {
    const hasActiveAnalysis = videos.some(
      (v) => v.status === 'pending' || v.status === 'processing'
    );
    if (!hasActiveAnalysis) return;

    const interval = setInterval(() => {
      void fetchVideos();
    }, 3500);

    return () => clearInterval(interval);
  }, [videos, fetchVideos]);

  const submitVideo = async (payload: UploadVideoPayload) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await uploadVideoAttempt(payload, (percent) => {
        setUploadProgress(percent);
      });
      await fetchVideos();
      return result;
    } catch (caughtError: unknown) {
      const vError = caughtError as UserFacingError;
      const msg =
        vError.userMessage ??
        vError.message ??
        'Video upload failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const retryAnalysis = async (videoId: string): Promise<boolean> => {
    try {
      await retryVideoAnalysis(videoId);
      await fetchVideos();
      return true;
    } catch (caughtError: unknown) {
      const vError = caughtError as UserFacingError;
      const msg =
        vError.userMessage ?? vError.message ?? 'Could not retry AI analysis.';
      setError(msg);
      return false;
    }
  };

  const removeVideo = async (videoId: string): Promise<boolean> => {
    try {
      await deleteVideoAttempt(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      return true;
    } catch (caughtError: unknown) {
      const vError = caughtError as UserFacingError;
      const msg =
        vError.userMessage ?? vError.message ?? 'Failed to delete video.';
      setError(msg);
      return false;
    }
  };

  return {
    videos,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    submitVideo,
    retryAnalysis,
    removeVideo,
    refreshVideos: fetchVideos,
  };
}
