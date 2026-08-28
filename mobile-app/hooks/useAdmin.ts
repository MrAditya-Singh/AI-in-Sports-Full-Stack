/**
 * ATHLETIX — useAdmin Custom Hook (Phase 8)
 * hooks/useAdmin.ts
 *
 * Manages admin analytics data, user directory filtering, role promotion,
 * and video content oversight state.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getPlatformAnalytics,
  getAdminUsers,
  getAdminVideos,
  updateUserRole,
  deleteAdminVideo,
  AdminVideoItem,
  PlatformAnalyticsData,
} from '../services/adminService';
import { UserProfile } from '../services/userService';

export function useAdmin() {
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [users, setUsers]         = useState<UserProfile[]>([]);
  const [videos, setVideos]       = useState<AdminVideoItem[]>([]);

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'athlete' | 'official' | 'admin'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await getPlatformAnalytics();
      setAnalytics(data);
    } catch {
      // Fallback
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const roleParam = selectedRoleFilter === 'all' ? undefined : selectedRoleFilter;
      const data = await getAdminUsers(roleParam);
      setUsers(data);
    } catch {
      // Fallback
    }
  }, [selectedRoleFilter]);

  const loadVideos = useCallback(async () => {
    try {
      const data = await getAdminVideos();
      setVideos(data);
    } catch {
      // Fallback
    }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([loadAnalytics(), loadUsers(), loadVideos()]);
    } catch (err: any) {
      setError(err?.userMessage ?? 'Could not load admin panel.');
    } finally {
      setIsLoading(false);
    }
  }, [loadAnalytics, loadUsers, loadVideos]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const changeRole = async (userId: string, newRole: 'athlete' | 'official' | 'admin') => {
    setIsUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      await Promise.all([loadUsers(), loadAnalytics()]);
      return true;
    } catch (err: any) {
      setError(err?.userMessage ?? 'Failed to update user role.');
      return false;
    } finally {
      setIsUpdatingId(null);
    }
  };

  const deleteVideo = async (videoId: string) => {
    setIsUpdatingId(videoId);
    try {
      await deleteAdminVideo(videoId);
      await Promise.all([loadVideos(), loadAnalytics()]);
      return true;
    } catch (err: any) {
      setError(err?.userMessage ?? 'Failed to delete video.');
      return false;
    } finally {
      setIsUpdatingId(null);
    }
  };

  return {
    analytics,
    users,
    videos,
    selectedRoleFilter,
    setSelectedRoleFilter,
    isLoading,
    isUpdatingId,
    error,
    changeRole,
    deleteVideo,
    refreshAdmin: loadAll,
  };
}
