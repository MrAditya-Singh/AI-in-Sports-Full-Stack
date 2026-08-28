/**
 * ATHLETIX — Verification Service
 * services/verificationService.ts
 *
 * Handles:
 * - Athlete verification request submission
 * - Verification request history
 * - Admin pending/all request queue
 * - Private document signed URLs
 * - Admin approve/reject actions
 */

import { Platform } from 'react-native';

import type {
  DocumentPickerAsset,
} from 'expo-document-picker';

import api from './api';


export type VerificationStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export type VerificationReviewDecision =
  | 'approved'
  | 'rejected';


export interface VerificationAthlete {
  id: string;
  name: string;
  email: string;
}


export interface VerificationVideo {
  id: string;
  sport: string;
  exercise: string;
  video_url: string;
  status: string;
  uploaded_at: string;
}


export interface VerificationRequestItem {
  id: string;
  athlete_id: string;
  video_id: string;
  exercise: string;

  details: string;
  document_paths: string[];

  status: VerificationStatus;

  reviewed_by: string | null;
  review_note: string | null;

  created_at: string;
  updated_at: string;
  reviewed_at: string | null;

  athlete?: VerificationAthlete | null;
  video?: VerificationVideo | null;
}


export interface VerificationDocument {
  path: string;
  signed_url: string;
  expires_in: number;
}


export interface VerificationReviewPayload {
  status: VerificationReviewDecision;
  review_note?: string;
}


function normalizeRequest(
  raw: any,
): VerificationRequestItem {
  return {
    id:
      typeof raw?.id === 'string'
        ? raw.id
        : '',

    athlete_id:
      typeof raw?.athlete_id === 'string'
        ? raw.athlete_id
        : '',

    video_id:
      typeof raw?.video_id === 'string'
        ? raw.video_id
        : '',

    exercise:
      typeof raw?.exercise === 'string'
        ? raw.exercise
        : '',

    details:
      typeof raw?.details === 'string'
        ? raw.details
        : '',

    document_paths:
      Array.isArray(raw?.document_paths)
        ? raw.document_paths.filter(
            (path: unknown): path is string =>
              typeof path === 'string',
          )
        : [],

    status:
      raw?.status === 'approved' ||
      raw?.status === 'rejected'
        ? raw.status
        : 'pending',

    reviewed_by:
      typeof raw?.reviewed_by === 'string'
        ? raw.reviewed_by
        : null,

    review_note:
      typeof raw?.review_note === 'string'
        ? raw.review_note
        : null,

    created_at:
      typeof raw?.created_at === 'string'
        ? raw.created_at
        : '',

    updated_at:
      typeof raw?.updated_at === 'string'
        ? raw.updated_at
        : '',

    reviewed_at:
      typeof raw?.reviewed_at === 'string'
        ? raw.reviewed_at
        : null,

    athlete:
      raw?.athlete &&
      typeof raw.athlete === 'object'
        ? {
            id:
              typeof raw.athlete.id === 'string'
                ? raw.athlete.id
                : '',
            name:
              typeof raw.athlete.name === 'string'
                ? raw.athlete.name
                : 'Athlete',
            email:
              typeof raw.athlete.email === 'string'
                ? raw.athlete.email
                : '',
          }
        : null,

    video:
      raw?.video &&
      typeof raw.video === 'object'
        ? {
            id:
              typeof raw.video.id === 'string'
                ? raw.video.id
                : '',
            sport:
              typeof raw.video.sport === 'string'
                ? raw.video.sport
                : '',
            exercise:
              typeof raw.video.exercise === 'string'
                ? raw.video.exercise
                : '',
            video_url:
              typeof raw.video.video_url === 'string'
                ? raw.video.video_url
                : '',
            status:
              typeof raw.video.status === 'string'
                ? raw.video.status
                : '',
            uploaded_at:
              typeof raw.video.uploaded_at === 'string'
                ? raw.video.uploaded_at
                : '',
          }
        : null,
  };
}


/**
 * Athlete submits a verification request using multipart/form-data.
 */
export async function submitVerificationRequest(
  videoId: string,
  details: string,
  documents: DocumentPickerAsset[],
): Promise<VerificationRequestItem> {
  if (!videoId.trim()) {
    throw new Error('Select a completed video.');
  }

  const cleanedDetails = details.trim();

  if (
    cleanedDetails.length < 1 ||
    cleanedDetails.length > 2000
  ) {
    throw new Error(
      'Please enter verification details (1 to 2000 characters).',
    );
  }

  if (
    documents.length < 1 ||
    documents.length > 5
  ) {
    throw new Error(
      'Select between 1 and 5 documents.',
    );
  }

  const formData = new FormData();

  formData.append(
    'video_id',
    videoId.trim(),
  );

  formData.append(
    'details',
    cleanedDetails,
  );

  for (const document of documents) {
    let mimeType =
      document.mimeType ??
      'application/octet-stream';

    const lowerName = (document.name || '').toLowerCase();
    if (mimeType === 'application/octet-stream' || !mimeType) {
      if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (lowerName.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (lowerName.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else if (lowerName.endsWith('.pdf')) {
        mimeType = 'application/pdf';
      }
    }

    const docName = document.name || (mimeType === 'application/pdf' ? 'document.pdf' : 'document.jpg');

    if (Platform.OS === 'web') {
      let webFile: Blob | null = null;
      if (typeof File !== 'undefined' && document.file instanceof File) {
        webFile = document.file;
      } else if (typeof Blob !== 'undefined' && document.file instanceof Blob) {
        webFile = document.file;
      } else if (document.uri) {
        try {
          const res = await fetch(document.uri);
          if (res.ok) {
            webFile = await res.blob();
          }
        } catch (e) {
          console.warn('Could not fetch document blob on web:', e);
        }
      }

      if (webFile) {
        formData.append(
          'documents',
          webFile,
          docName,
        );
      } else {
        formData.append(
          'documents',
          {
            uri: document.uri,
            name: docName,
            type: mimeType,
          } as any,
        );
      }
    } else {
      // React Native Android/iOS multipart file.
      formData.append(
        'documents',
        {
          uri: document.uri,
          name: docName,
          type: mimeType,
        } as any,
      );
    }
  }

  const config: Record<string, any> = {
    timeout: 120_000,
  };

  if (Platform.OS !== 'web') {
    config.headers = {
      'Content-Type': 'multipart/form-data',
    };
  }

  const response = await api.post(
    '/verifications/requests',
    formData,
    config,
  );

  const request =
    response.data?.data?.request;

  if (!request) {
    throw new Error(
      'Backend returned an invalid verification request.',
    );
  }

  return normalizeRequest(request);
}


/**
 * Athlete's pending/approved/rejected history.
 */
export async function getMyVerificationRequests():
Promise<VerificationRequestItem[]> {
  const response = await api.get(
    '/verifications/requests/mine',
  );

  const data = response.data?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeRequest)
    .filter((item) => Boolean(item.id));
}


/**
 * Admin verification queue.
 */
export async function getAdminVerificationRequests(
  status?: VerificationStatus,
): Promise<VerificationRequestItem[]> {
  const params:
    Record<string, string | number> = {
      limit: 100,
    };

  if (status) {
    params.status = status;
  }

  const response = await api.get(
    '/verifications/requests',
    { params },
  );

  const data = response.data?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeRequest)
    .filter((item) => Boolean(item.id));
}


/**
 * Gets temporary URLs for private documents.
 */
export async function getVerificationDocuments(
  requestId: string,
): Promise<VerificationDocument[]> {
  const response = await api.get(
    `/verifications/requests/${requestId}/documents`,
  );

  const data = response.data?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter(
      (item: any) =>
        typeof item?.path === 'string' &&
        typeof item?.signed_url === 'string',
    )
    .map(
      (item: any): VerificationDocument => ({
        path: item.path,
        signed_url: item.signed_url,
        expires_in:
          Number.isFinite(
            Number(item.expires_in),
          )
            ? Number(item.expires_in)
            : 600,
      }),
    );
}


/**
 * Admin approves or rejects a pending request.
 */
export async function reviewVerificationRequest(
  requestId: string,
  payload: VerificationReviewPayload,
): Promise<VerificationRequestItem> {
  const reviewNote =
    payload.review_note?.trim();

  if (
    payload.status === 'rejected' &&
    (!reviewNote || reviewNote.length < 3)
  ) {
    throw new Error(
      'Enter a rejection reason of at least 3 characters.',
    );
  }

  const response = await api.patch(
    `/verifications/requests/${requestId}/review`,
    {
      status: payload.status,
      review_note: reviewNote || null,
    },
  );

  const request =
    response.data?.data?.request;

  if (!request) {
    throw new Error(
      'Backend returned an invalid reviewed request.',
    );
  }

  return normalizeRequest(request);
}