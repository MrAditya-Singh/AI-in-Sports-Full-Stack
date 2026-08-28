/**
 * ATHLETIX — Verification Hook
 * hooks/useVerification.ts
 *
 * Responsibilities:
 * - Athlete ke completed videos load karna
 * - Athlete ki verification request history load karna
 * - New verification request submit karna
 * - Pending/approved/rejected status refresh karna
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { DocumentPickerAsset } from 'expo-document-picker';

import {
  getMyVerificationRequests,
  submitVerificationRequest,
  VerificationRequestItem,
} from '../services/verificationService';

import {
  getMyVideos,
  VideoRecord,
} from '../services/videoService';

export interface UseVerificationResult {
  videos: VideoRecord[];
  completedVideos: VideoRecord[];
  requests: VerificationRequestItem[];

  selectedVideoId: string | null;
  setSelectedVideoId: (videoId: string | null) => void;

  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;

  refresh: () => Promise<void>;

  submitRequest: (
    details: string,
    documents: DocumentPickerAsset[],
  ) => Promise<VerificationRequestItem>;
}

function getUserError(
  error: unknown,
  fallback: string,
): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const value = error as {
    userMessage?: string;
    message?: string;
  };

  return value.userMessage ?? value.message ?? fallback;
}

export function useVerification(initialVideoId?: string | null): UseVerificationResult {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [requests, setRequests] =
    useState<VerificationRequestItem[]>([]);

  const [selectedVideoId, setSelectedVideoId] =
    useState<string | null>(initialVideoId ?? null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Only successfully analysed videos can be verified.
  const completedVideos = useMemo(
    () => videos.filter((video) => video.status === 'completed'),
    [videos],
  );

  const pendingCount = useMemo(
    () => requests.filter(
      (request) => request.status === 'pending',
    ).length,
    [requests],
  );

  const approvedCount = useMemo(
    () => requests.filter(
      (request) => request.status === 'approved',
    ).length,
    [requests],
  );

  const rejectedCount = useMemo(
    () => requests.filter(
      (request) => request.status === 'rejected',
    ).length,
    [requests],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // ✅ Videos and requests parallel mein load honge.
      const [videoRows, requestRows] = await Promise.all([
        getMyVideos(),
        getMyVerificationRequests(),
      ]);

      setVideos(videoRows);
      setRequests(requestRows);

      const completed = videoRows.filter(
        (video) => video.status === 'completed',
      );

      setSelectedVideoId((currentVideoId) => {
        const targetId = currentVideoId || initialVideoId;
        // Existing or initial selection valid hai toh preserve karo.
        if (
          targetId &&
          completed.some((video) => video.id === targetId)
        ) {
          return targetId;
        }

        // Otherwise first completed video select karo.
        return completed[0]?.id ?? null;
      });
    } catch (caughtError: unknown) {
      setError(
        getUserError(
          caughtError,
          'Could not load verification information.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [initialVideoId]);


  const submitRequest = useCallback(
    async (
      details: string,
      documents: DocumentPickerAsset[],
    ): Promise<VerificationRequestItem> => {
      setError(null);

      if (!selectedVideoId) {
        const message =
          'Please select a completed performance video.';
        setError(message);
        throw new Error(message);
      }

      const normalizedDetails = details.trim();

      if (normalizedDetails.length < 1) {
        const message =
          'Please enter verification details or reason for review.';
        setError(message);
        throw new Error(message);
      }

      if (normalizedDetails.length > 2000) {
        const message =
          'Verification details cannot exceed 2000 characters.';
        setError(message);
        throw new Error(message);
      }

      if (documents.length < 1) {
        const message =
          'Please attach at least one supporting document.';
        setError(message);
        throw new Error(message);
      }

      if (documents.length > 5) {
        const message =
          'You can attach a maximum of 5 documents.';
        setError(message);
        throw new Error(message);
      }

      const selectedVideo = completedVideos.find(
        (video) => video.id === selectedVideoId,
      );

      if (!selectedVideo) {
        const message =
          'Selected video is not completed or no longer available.';
        setError(message);
        throw new Error(message);
      }

      setIsSubmitting(true);

      try {
        // ✅ Mobile app directly privileged Supabase operation nahi karegi.
        // Request authenticated FastAPI backend ke through jayegi.
        const createdRequest = await submitVerificationRequest(
          selectedVideoId,
          normalizedDetails,
          documents,
        );

        // Latest request ko top par immediately show karo.
        setRequests((currentRequests) => [
          createdRequest,
          ...currentRequests.filter(
            (request) => request.id !== createdRequest.id,
          ),
        ]);

        return createdRequest;
      } catch (caughtError: unknown) {
        const message = getUserError(
          caughtError,
          'Could not submit verification request.',
        );

        setError(message);
        throw caughtError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [completedVideos, selectedVideoId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    videos,
    completedVideos,
    requests,

    selectedVideoId,
    setSelectedVideoId,

    isLoading,
    isSubmitting,
    error,

    pendingCount,
    approvedCount,
    rejectedCount,

    refresh,
    submitRequest,
  };
}