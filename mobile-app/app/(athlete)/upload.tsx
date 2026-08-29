/**
 * ATHLETIX — Video Upload & AI Assessment Portal (Minimalist Dual-Tone Stream)
 * app/(athlete)/upload.tsx
 *
 * Design:
 * - Minimalist Stream flow (No Bento Grids)
 * - Exact Dual-Tone Cream (#F7F4EE) & Obsidian (#111111) palette
 * - Innovative Vector Icons via InnovativeIcon
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import NeomorphicButton from '../../components/NeomorphicButton';
import { useVideos } from '../../hooks/useVideos';
import { SPORTS, Sport, Exercise, findExercise } from '../../constants/sports';
import { useTheme } from '../../hooks/useTheme';

export default function UploadVideoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { videos, isUploading, uploadProgress, submitVideo, refreshVideos, removeVideo } = useVideos();

  const [selectedSport, setSelectedSport] = useState<Sport>('powerlifting');
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('squat');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentSport = SPORTS.find((s) => s.key === selectedSport);
  const currentExerciseInfo = findExercise(selectedExercise);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePickVideo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name || 'attempt.mp4',
          size: asset.size,
        });
        showToast(`Video attached: ${asset.name || 'attempt.mp4'}`, 'success');
      }
    } catch {
      showToast('Could not open file picker on this device.', 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a video file first.', 'error');
      return;
    }

    try {
      await submitVideo({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: 'video/mp4',
        sport: selectedSport,
        exercise: selectedExercise,
      });

      setSelectedFile(null);
      showToast('Video uploaded. AI BlazePose analysis in progress.', 'success');
      await refreshVideos();
    } catch (err: any) {
      showToast(err?.message || 'Upload failed.', 'error');
    }
  };

  const handleRemoveAttempt = (videoId: string) => {
    Alert.alert(
      'Remove Attempt',
      'Are you sure you want to remove this attempt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeVideo(videoId);
            await refreshVideos();
          },
        },
      ],
    );
  };

  const recentLogs = (videos || []).slice(0, 5);

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Top Header ── */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <InnovativeIcon name="arrow-left" size={16} color={colors.textPrimary} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                AI Video Assessment
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                MediaPipe BlazePose 33-Keypoint Biomechanics
              </Text>
            </View>
          </View>

          {toast && (
            <View
              style={[
                styles.toast,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                  borderColor: colors.border,
                },
              ]}
            >
              <InnovativeIcon
                name={toast.type === 'success' ? 'check-circle' : 'alert-circle'}
                size={16}
                color={colors.textPrimary}
              />
              <Text style={[styles.toastText, { color: colors.textPrimary }]}>
                {toast.message}
              </Text>
            </View>
          )}

          {/* ── Step 1: Sport Selector Stream ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            1. SPORT DISCIPLINE
          </Text>
          <View style={styles.sportStreamRow}>
            {SPORTS.map((sport) => {
              const isSelected = selectedSport === sport.key;
              return (
                <Pressable
                  key={sport.key}
                  onPress={() => {
                    setSelectedSport(sport.key);
                    setSelectedExercise(sport.exercises[0].key);
                  }}
                  style={({ pressed }) => [
                    styles.sportStreamCard,
                    {
                      backgroundColor: isSelected
                        ? isDark ? colors.primary : '#111111'
                        : isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: isSelected
                        ? isDark ? colors.primaryLight : '#111111'
                        : colors.border,
                      transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                    },
                  ]}
                >
                  <InnovativeIcon
                    name={sport.key === 'powerlifting' ? 'dumbell' : 'activity'}
                    size={20}
                    color={isSelected ? '#F7F4EE' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.sportStreamName,
                      { color: isSelected ? '#F7F4EE' : colors.textPrimary },
                    ]}
                  >
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Step 2: Exercise Selector ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            2. EXERCISE MOVEMENT
          </Text>
          <View style={styles.exerciseRow}>
            {currentSport?.exercises.map((ex) => {
              const isSelected = selectedExercise === ex.key;
              return (
                <Pressable
                  key={ex.key}
                  onPress={() => setSelectedExercise(ex.key)}
                  style={({ pressed }) => [
                    styles.exerciseChip,
                    {
                      backgroundColor: isSelected
                        ? isDark ? colors.primary : '#111111'
                        : isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                      borderColor: isSelected
                        ? isDark ? colors.primaryLight : '#111111'
                        : colors.border,
                      transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      { color: isSelected ? '#F7F4EE' : colors.textSecondary },
                    ]}
                  >
                    {ex.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Step 3: Minimalist Dropzone ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            3. ATTACH VIDEO ATTEMPT
          </Text>
          <MinimalCard onPress={handlePickVideo} contentStyle={{ padding: 22 }}>
            <View style={styles.dropzoneContent}>
              <View
                style={[
                  styles.uploadIconContainer,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                ]}
              >
                <InnovativeIcon
                  name={selectedFile ? 'check-circle' : 'camera'}
                  size={26}
                  color={colors.textPrimary}
                />
              </View>

              {selectedFile ? (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.dropzoneTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={[styles.dropzoneSub, { color: colors.textSecondary }]}>
                    {selectedFile.size ? `${Math.round(selectedFile.size / 1024 / 1024 * 10) / 10} MB · File Ready` : 'Ready to Analyze'}
                  </Text>
                  <Text style={[styles.changeFileText, { color: colors.textMuted }]}>
                    Tap to change video file
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.dropzoneTitle, { color: colors.textPrimary }]}>
                    Choose Performance Video
                  </Text>
                  <Text style={[styles.dropzoneSub, { color: colors.textMuted }]}>
                    MP4, MOV, WEBM (Up to 250 MB)
                  </Text>
                </View>
              )}
            </View>
          </MinimalCard>

          {/* Upload Progress */}
          {isUploading && (
            <MinimalCard contentStyle={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
                  Uploading & Initializing BlazePose...
                </Text>
                <Text style={[styles.progressVal, { color: colors.textPrimary }]}>
                  {uploadProgress}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EFECE4' }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${uploadProgress}%` }]} />
              </View>
            </MinimalCard>
          )}

          {/* Upload CTA */}
          <NeomorphicButton
            title={isUploading ? 'ANALYZING BIOMECHANICS...' : 'LAUNCH AI ASSESSMENT'}
            icon={<InnovativeIcon name="zap" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
            onPress={handleUpload}
            loading={isUploading}
            disabled={!selectedFile || isUploading}
            variant="primary"
            size="lg"
            style={{ marginTop: 14, marginBottom: 24 }}
          />

          {/* ── Recent Attempts Stream ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            RECENT ATTEMPTS ({recentLogs.length})
          </Text>

          {recentLogs.length === 0 ? (
            <MinimalCard contentStyle={{ padding: 20, alignItems: 'center' }}>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                No uploaded attempts recorded yet.
              </Text>
            </MinimalCard>
          ) : (
            <View style={{ gap: 8, marginBottom: 30 }}>
              {recentLogs.map((item) => (
                <MinimalCard key={item.id} contentStyle={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={[
                        styles.logIconBox,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
                      ]}
                    >
                      <InnovativeIcon name="video" size={18} color={colors.textPrimary} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
                          {(item.exercise || 'Performance').replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        <View
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor:
                                item.status === 'completed'
                                  ? isDark ? 'rgba(57, 255, 20, 0.12)' : '#111111'
                                  : isDark ? 'rgba(255, 170, 0, 0.12)' : '#EFECE4',
                              borderColor:
                                item.status === 'completed'
                                  ? isDark ? 'rgba(57, 255, 20, 0.3)' : '#111111'
                                  : isDark ? 'rgba(255, 170, 0, 0.3)' : '#E4DFD3',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusChipText,
                              {
                                color:
                                  item.status === 'completed'
                                    ? isDark ? colors.secondary : '#F7F4EE'
                                    : isDark ? colors.warning : '#111111',
                              },
                            ]}
                          >
                            {item.status === 'completed' ? 'READY' : 'PROCESSING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.logDate, { color: colors.textMuted }]}>
                        {new Date(item.uploaded_at).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.logActionsRow, { borderTopColor: colors.border }]}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/(athlete)/verification',
                          params: { videoId: item.id },
                        } as any)
                      }
                      style={[
                        styles.microActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="shield-check" size={13} color={colors.textPrimary} />
                      <Text style={[styles.microActionText, { color: colors.textPrimary }]}>
                        Verify
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => router.push('/(athlete)/reports' as any)}
                      style={[
                        styles.microActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="bar-chart" size={13} color={colors.textPrimary} />
                      <Text style={[styles.microActionText, { color: colors.textPrimary }]}>
                        Report
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleRemoveAttempt(item.id)}
                      style={[
                        styles.microActionBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <InnovativeIcon name="trash" size={13} color={colors.textPrimary} />
                      <Text style={[styles.microActionText, { color: colors.textPrimary }]}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </MinimalCard>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '500' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  toastText: { fontSize: 12, fontWeight: '700' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  sportStreamRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sportStreamCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  sportStreamName: { fontSize: 13, fontWeight: '800' },
  exerciseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  exerciseChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  exerciseChipText: { fontSize: 12, fontWeight: '700' },
  dropzoneContent: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  uploadIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneTitle: { fontSize: 15, fontWeight: '800' },
  dropzoneSub: { fontSize: 12, fontWeight: '500' },
  changeFileText: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  progressLabel: { fontSize: 12, fontWeight: '700' },
  progressVal: { fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: { fontSize: 13, fontWeight: '800' },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusChipText: { fontSize: 9, fontWeight: '900' },
  logDate: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  logActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  microActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  microActionText: { fontSize: 11, fontWeight: '800' },
  emptySub: { fontSize: 12, fontWeight: '500' },
});
