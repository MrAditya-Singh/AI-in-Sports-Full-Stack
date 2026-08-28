/**
 * ATHLETIX — Admin Service (Phase 8)
 * services/adminService.ts
 *
 * API calls for platform analytics, user directory, role management, and video oversight.
 */

import api from './api';
import { UserProfile } from './userService';

export interface PlatformAnalyticsData {
  users: {
    total:     number;
    athletes:  number;
    officials: number;
    admins:    number;
  };
  videos: {
    total:        number;
    completed:    number;
    pending:      number;
    failed:       number;
    powerlifting: number;
    calisthenics:  number;
  };
  assessments: {
    total:        number;
    avg_score:    number;
    avg_time_sec: number;
  };
  scouting: {
    verifications: number;
    shortlisted:   number;
  };
}

export interface AdminVideoItem {
  id:          string;
  athlete_id:  string;
  sport:       string;
  exercise:    string;
  video_url:   string;
  status:      string;
  uploaded_at: string;
  athlete?: {
    name?:  string;
    email?: string;
  };
}

/** Fetches real-time platform analytics */
export async function getPlatformAnalytics(): Promise<PlatformAnalyticsData> {
  const response = await api.get('/admin/analytics');
  return response.data.data;
}

/** Lists registered users with optional role filtering */
export async function getAdminUsers(role?: 'athlete' | 'official' | 'admin'): Promise<UserProfile[]> {
  const params = role ? { role } : {};
  const response = await api.get('/admin/users', { params });
  return response.data.data || [];
}

/** Updates a user's system role */
export async function updateUserRole(userId: string, newRole: 'athlete' | 'official' | 'admin'): Promise<void> {
  await api.put(`/admin/users/${userId}/role`, { new_role: newRole });
}

/** Fetches all uploaded videos for content oversight */
export async function getAdminVideos(): Promise<AdminVideoItem[]> {
  const response = await api.get('/admin/videos');
  return response.data.data || [];
}

/** Deletes a video record for content moderation */
export async function deleteAdminVideo(videoId: string): Promise<void> {
  await api.delete(`/admin/videos/${videoId}`);
}
