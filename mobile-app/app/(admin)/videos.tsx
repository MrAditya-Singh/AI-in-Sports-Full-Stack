/**
 * ATHLETIX — Admin Video & Content Oversight Screen
 * app/(admin)/videos.tsx
 *
 * Features:
 *  - Dynamic Light & Dark Theme support with ThemeToggle
 *  - Video Content Oversight Directory
 *  - Status & Sport Filter Chips (All / Completed / Processing / Failed, Powerlifting / Calisthenics)
 *  - Video Metadata Cards with Athlete details & AI Status
 *  - Open Video URL & Delete/Moderate Video actions
 *  - Toast Feedback & Pull-to-refresh
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ThemeToggle from '../../components/ThemeToggle';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { AdminVideoItem } from '../../services/adminService';

type StatusFilter = 'all' | 'completed' | 'processing' | 'pending' | 'failed';
type SportFilter = 'all' | 'powerlifting' | 'calisthenics';

function formatExercise(value?: string): string {
  if (!value) return 'Exercise';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
}

export default function AdminVideoOversightScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(
        role === 'athlete'
          ? '/(athlete)/dashboard'
          : '/(official)/dashboard',
      );
    }
  }, [role, router]);

  const {
    videos,
    isLoading,
    isUpdatingId,
    deleteVideo,
    refreshAdmin,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sportFilter, setSportFilter]   = useState<SportFilter>('all');
  const [toast, setToast]               = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':  return colors.secondary;
      case 'processing': return colors.primary;
      case 'pending':    return colors.warning;
      case 'failed':     return colors.error;
      default:           return colors.textMuted;
    }
  };

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchStatus =
        statusFilter === 'all' ||
        v.status === statusFilter ||
        (statusFilter === 'processing' && v.status === 'pending');
      const matchSport =
        sportFilter === 'all' || v.sport?.toLowerCase() === sportFilter;
      return matchStatus && matchSport;
    });
  }, [videos, statusFilter, sportFilter]);

  const handleDelete = (video: AdminVideoItem) => {
    Alert.alert(
      'Delete Video Record',
      `Permanently delete ${formatExercise(video.exercise)} upload and its AI assessment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteVideo(video.id);
            if (success) {
              showToast('Video submission removed.');
            }
          },
        },
      ]
    );
  };

  const handleOpenVideo = (videoUrl?: string | null) => {
    if (videoUrl) {
      void Linking.openURL(videoUrl);
    } else {
      showToast('Video streaming URL unavailable.');
    }
  };

  const renderVideoCard = ({ item }: { item: AdminVideoItem }) => {
    const statusColor = getStatusColor(item.status);
    const athleteName = item.athlete?.name || 'Athlete';
    const isBusy = isUpdatingId === item.id;
    const scoreVal = (item as any).score;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.exerciseTitle, { color: colors.textPrimary }]}>
                {formatExercise(item.exercise)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${statusColor}18`,
                    borderColor: `${statusColor}45`,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.sport?.toUpperCase()} · Uploaded {formatDate(item.uploaded_at)}
            </Text>
          </View>

          {scoreVal !== null && scoreVal !== undefined && (
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreValue, { color: colors.secondary }]}>
                {typeof scoreVal === 'number' ? scoreVal.toFixed(1) : scoreVal}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
                AI SCORE
              </Text>
            </View>
          )}
        </View>

        {/* Athlete info */}
        <View
          style={[
            styles.athleteRow,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.athleteName, { color: colors.textSecondary }]}>
            👤 {athleteName}
            {item.athlete?.email ? ` · ${item.athlete.email}` : ''}
          </Text>
          <Text style={[styles.videoIdText, { color: colors.textMuted }]}>
            ID: {item.id.substring(0, 8)}...
          </Text>
        </View>

        {/* Actions */}
        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          {item.video_url ? (
            <Pressable
              onPress={() => handleOpenVideo(item.video_url)}
              style={[
                styles.watchBtn,
                {
                  backgroundColor: `${colors.primary}18`,
                  borderColor: `${colors.primary}45`,
                },
              ]}
            >
              <Text style={[styles.watchBtnText, { color: colors.primary }]}>
                ▶ Play Stream
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => handleDelete(item)}
            disabled={isBusy}
            style={[
              styles.deleteBtn,
              {
                backgroundColor: `${colors.error}15`,
                borderColor: `${colors.error}40`,
              },
            ]}
          >
            <Text style={[styles.deleteBtnText, { color: colors.error }]}>
              🗑️ Delete Video
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.replace('/(admin)/dashboard' as never)}
              style={styles.backBtn}
            >
              <Text style={[styles.backText, { color: colors.primary }]}>
                ← Dashboard
              </Text>
            </Pressable>

            <ThemeToggle compact />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            VIDEO OVERSIGHT & CONTENT 🎬
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Platform-Wide Video Submissions & Processing Moderation
          </Text>
        </View>

        {/* Toast */}
        {toast ? (
          <View
            style={[
              styles.toast,
              {
                backgroundColor: `${colors.primary}20`,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.toastText, { color: colors.primary }]}>
              {toast}
            </Text>
          </View>
        ) : null}

        {/* Filter Pills */}
        <View style={styles.filtersWrapper}>
          <View style={styles.statusFiltersRow}>
            {(['all', 'completed', 'processing', 'failed'] as StatusFilter[]).map((st) => (
              <Pressable
                key={st}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  statusFilter === st && [
                    styles.activeFilterPill,
                    {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ],
                ]}
                onPress={() => setStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: colors.textMuted },
                    statusFilter === st && { color: colors.primary, fontWeight: '900' },
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading video records...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredVideos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => void refreshAdmin()}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Videos Found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No uploaded submissions match the selected filter.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 11, marginTop: 2 },

  toast: {
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  toastText: { fontSize: 12, fontWeight: '700' },

  filtersWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  statusFiltersRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeFilterPill: {},
  filterPillText: { fontSize: 10, fontWeight: '700' },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseTitle: { fontSize: 15, fontWeight: '900' },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  metaText: { fontSize: 11, marginTop: 2 },

  scoreBox: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 18, fontWeight: '900' },
  scoreLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  athleteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  athleteName: { fontSize: 11, fontWeight: '700' },
  videoIdText: { fontSize: 9 },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  watchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  watchBtnText: { fontSize: 11, fontWeight: '800' },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 11, fontWeight: '800' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 13 },

  emptyBox: {
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 20,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
