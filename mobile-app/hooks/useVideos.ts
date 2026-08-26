/**
 * ATHLETIX — useVideos Custom Hook (Phase 3)
 * hooks/useVideos.ts
 *
 * Manages video uploads, upload progress, polling for AI pipeline completion,
 * and athlete's video submission history.
 */

import { useState, useCallback, useEffect } from 'react';
import { getMyVideos, uploadVideoAttempt, VideoRecord, UploadVideoPayload } from '../services/videoService';

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
    } catch (err: any) {
      setError(err?.userMessage || 'Could not fetch videos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Poll every 5s if any video is pending/processing to update status live
  useEffect(() => {
    const hasActiveAnalysis = videos.some((v) => v.status === 'pending' || v.status === 'processing');
    if (!hasActiveAnalysis) return;

    const interval = setInterval(() => {
      fetchVideos();
    }, 5000);

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
    } catch (err: any) {
      const msg = err?.userMessage || 'Video upload failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    videos,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    submitVideo,
    refreshVideos: fetchVideos,
  };
}
