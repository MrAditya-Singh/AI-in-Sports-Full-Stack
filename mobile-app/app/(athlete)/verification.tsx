/**
 * ATHLETIX — Athlete Verification Request Screen
 * app/(athlete)/verification.tsx
 *
 * Features:
 * - Dynamic Light & Dark Theme support with ThemeToggle
 * - Completed performance video selection with score previews
 * - Supporting document selection with file size metadata
 * - Verification details submission
 * - VerificationBadge component for request status
 * - Pending, approved and rejected status history
 * - Pull-to-refresh
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import ThemeToggle from '../../components/ThemeToggle';
import { useVerification } from '../../hooks/useVerification';
import { useTheme } from '../../hooks/useTheme';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

const MAX_DOCUMENTS = 5;
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatExercise(exercise?: string): string {
  if (!exercise) return 'Performance';

  return exercise
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString();
}

function formatFileSize(size?: number): string {
  if (!size) return '';

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AthleteVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ videoId?: string }>();
  const { colors, isDark } = useTheme();

  const {
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
  } = useVerification(params.videoId);

  const [details, setDetails] = useState('');
  const [documents, setDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const selectedVideo = useMemo(
    () => completedVideos.find((video) => video.id === selectedVideoId) ?? null,
    [completedVideos, selectedVideoId],
  );

  async function handlePickDocuments() {
    if (documents.length >= MAX_DOCUMENTS) {
      Alert.alert(
        'Document limit',
        `You can attach a maximum of ${MAX_DOCUMENTS} documents.`,
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets) {
        return;
      }

      const availableSlots = MAX_DOCUMENTS - documents.length;
      const validAssets = result.assets.slice(0, availableSlots);

      const oversized = validAssets.find(
        (asset) => (asset.size ?? 0) > MAX_DOC_SIZE_BYTES,
      );

      if (oversized) {
        Alert.alert(
          'File too large',
          `Document "${oversized.name}" exceeds the 10 MB limit. Please select a smaller file.`,
        );
        return;
      }

      setDocuments((prev) => [...prev, ...validAssets]);
    } catch {
      Alert.alert(
        'Document picker error',
        'Could not access document selection on this device.',
      );
    }
  }

  function handleRemoveDocument(index: number) {
    setDocuments((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit() {
    if (!selectedVideoId) {
      Alert.alert(
        'Video selection required',
        'Please select a completed performance video to verify.',
      );
      return;
    }

    if (details.trim().length < 10) {
      Alert.alert(
        'Details required',
        'Please enter at least 10 characters explaining your verification request.',
      );
      return;
    }

    if (documents.length === 0) {
      Alert.alert(
        'Document required',
        'Attach at least one image or PDF document.',
      );
      return;
    }

    try {
      await submitRequest(details, documents);

      setDetails('');
      setDocuments([]);

      Alert.alert(
        'Request submitted',
        'Your verification request has been submitted for official review.',
      );

      await refresh();
    } catch (caughtError: any) {
      Alert.alert(
        'Submission failed',
        caughtError?.userMessage ??
          caughtError?.message ??
          'Could not submit verification request.',
      );
    }
  }

  if (isLoading && completedVideos.length === 0 && requests.length === 0) {
    return (
      <LinearGradient
        colors={colors.gradientMain}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading verification information...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.topRow}>
              <Pressable
                onPress={() => router.replace('/(athlete)/dashboard' as never)}
                style={styles.backBtn}
              >
                <Text style={[styles.backText, { color: colors.primary }]}>
                  ← Dashboard
                </Text>
              </Pressable>

              <ThemeToggle compact />
            </View>

            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              ATHLETE TRUST CENTRE
            </Text>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Performance Verification
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Submit a completed performance with supporting documents for official verification badge.
            </Text>
          </View>

          {/* Status counters */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: colors.warning },
                ]}
              >
                {pendingCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                PENDING
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: colors.secondary },
                ]}
              >
                {approvedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                APPROVED
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: colors.error },
                ]}
              >
                {rejectedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                REJECTED
              </Text>
            </View>
          </View>

          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: `${colors.error}18`,
                  borderColor: `${colors.error}40`,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.error }]}>
                ⚠ {error}
              </Text>
              {error.toLowerCase().includes('token') ||
              error.toLowerCase().includes('session') ||
              error.toLowerCase().includes('expired') ||
              error.toLowerCase().includes('connect') ? (
                <Pressable
                  onPress={() => router.replace('/(auth)/login' as never)}
                  style={{
                    marginTop: 8,
                    alignSelf: 'flex-start',
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>
                    Log In Again ➔
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* New request card */}
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
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              New verification request
            </Text>

            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Only completed AI assessments are available.
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              SELECT PERFORMANCE
            </Text>

            {completedVideos.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.emptyIcon}>🎥</Text>

                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No completed videos
                </Text>

                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Upload a performance and wait for AI analysis to complete before requesting verification.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videoList}
              >
                {completedVideos.map((video) => {
                  const isSelected = selectedVideoId === video.id;

                  const activeRequest = requests.some(
                    (request) =>
                      request.video_id === video.id &&
                      (request.status === 'pending' || request.status === 'approved'),
                  );

                  const assessment = video.assessments?.[0];

                  return (
                    <Pressable
                      key={video.id}
                      onPress={() => setSelectedVideoId(video.id)}
                      style={[
                        styles.videoCard,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                        isSelected && [
                          styles.videoCardSelected,
                          {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}15`,
                          },
                        ],
                      ]}
                    >
                      <View style={styles.videoHeader}>
                        <Text style={styles.videoIcon}>🏃</Text>

                        {activeRequest ? (
                          <View
                            style={[
                              styles.existingBadge,
                              {
                                backgroundColor: `${colors.primary}20`,
                                borderColor: `${colors.primary}45`,
                              },
                            ]}
                          >
                            <Text style={[styles.existingBadgeText, { color: colors.primary }]}>
                              REQUESTED
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[styles.videoExercise, { color: colors.textPrimary }]}>
                        {formatExercise(video.exercise)}
                      </Text>

                      <Text style={[styles.videoSport, { color: colors.primary }]}>
                        {video.sport.toUpperCase()}
                      </Text>

                      <Text style={[styles.videoDate, { color: colors.textMuted }]}>
                        {formatDate(video.uploaded_at)}
                      </Text>

                      {assessment ? (
                        <Text style={[styles.videoScore, { color: colors.secondary }]}>
                          AI Score: {Math.round(assessment.score)}/100
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {selectedVideo ? (
              <View
                style={[
                  styles.selectionInfo,
                  {
                    backgroundColor: `${colors.primary}12`,
                    borderColor: `${colors.primary}30`,
                  },
                ]}
              >
                <Text style={[styles.selectionInfoText, { color: colors.primary }]}>
                  Selected: {formatExercise(selectedVideo.exercise)}
                  {' • '}
                  {selectedVideo.sport.toUpperCase()}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 16 }]}>
              VERIFICATION DETAILS
            </Text>

            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Explain your performance, event, achievement or reason for verification..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              editable={!isSubmitting}
              style={[
                styles.detailsInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />

            <View style={styles.charCountRow}>
              <Text style={[styles.charCountText, { color: colors.textMuted }]}>
                {details.length}/2000 characters
              </Text>
            </View>

            {/* Document attachments */}
            <View style={styles.docsHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                SUPPORTING DOCUMENTS ({documents.length}/{MAX_DOCUMENTS})
              </Text>

              {documents.length < MAX_DOCUMENTS ? (
                <Pressable
                  onPress={handlePickDocuments}
                  disabled={isSubmitting}
                  style={[
                    styles.addDocBtn,
                    {
                      backgroundColor: `${colors.primary}18`,
                      borderColor: `${colors.primary}40`,
                    },
                  ]}
                >
                  <Text style={[styles.addDocText, { color: colors.primary }]}>
                    + Add Document
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {documents.length === 0 ? (
              <Pressable
                onPress={handlePickDocuments}
                style={[
                  styles.docDropzone,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceElevated,
                  },
                ]}
              >
                <Text style={styles.docDropzoneIcon}>📎</Text>
                <Text style={[styles.docDropzoneText, { color: colors.textSecondary }]}>
                  Attach certificates, IDs, or scorecards (PNG, JPG, PDF)
                </Text>
              </Pressable>
            ) : (
              <View style={styles.docList}>
                {documents.map((doc, index) => (
                  <View
                    key={index}
                    style={[
                      styles.docItem,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.docItemIcon}>📄</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.docItemName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {doc.name}
                      </Text>
                      <Text style={[styles.docItemSize, { color: colors.textMuted }]}>
                        {formatFileSize(doc.size)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveDocument(index)}
                      style={styles.removeDocBtn}
                    >
                      <Text style={[styles.removeDocText, { color: colors.error }]}>
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Submit Action */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedVideoId}
              style={[
                styles.submitBtn,
                (!selectedVideoId || isSubmitting) && styles.submitBtnDisabled,
              ]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['#00D4FF', '#0099BB']
                    : ['#0284C7', '#0369A1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGrad}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    SUBMIT FOR OFFICIAL REVIEW 🛡️
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* History */}
          <View style={styles.historySection}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Verification History ({requests.length})
            </Text>

            {requests.length === 0 ? (
              <View
                style={[
                  styles.emptyHistoryBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={styles.emptyIcon}>🛡️</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Verification Requests
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Your submitted verification requests and official decisions will appear here.
                </Text>
              </View>
            ) : (
              requests.map((req) => (
                <View
                  key={req.id}
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                >
                  <View style={styles.historyTopRow}>
                    <View>
                      <Text style={[styles.historyExercise, { color: colors.textPrimary }]}>
                        {formatExercise(req.video?.exercise)}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                        Submitted {formatDate(req.created_at)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.existingBadge,
                        {
                          backgroundColor:
                            req.status === 'approved'
                              ? `${colors.secondary}20`
                              : req.status === 'rejected'
                              ? `${colors.error}20`
                              : `${colors.warning}20`,
                          borderColor:
                            req.status === 'approved'
                              ? colors.secondary
                              : req.status === 'rejected'
                              ? colors.error
                              : colors.warning,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.existingBadgeText,
                          {
                            color:
                              req.status === 'approved'
                                ? colors.secondary
                                : req.status === 'rejected'
                                ? colors.error
                                : colors.warning,
                          },
                        ]}
                      >
                        {req.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {req.details ? (
                    <Text
                      style={[styles.historyDetails, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {req.details}
                    </Text>
                  ) : null}

                  {req.review_note ? (
                    <View
                      style={[
                        styles.officialNotesBox,
                        {
                          backgroundColor: `${colors.primary}12`,
                          borderColor: `${colors.primary}30`,
                        },
                      ]}
                    >
                      <Text style={[styles.officialNotesLabel, { color: colors.primary }]}>
                        Official Scout Note:
                      </Text>
                      <Text style={[styles.officialNotesText, { color: colors.textPrimary }]}>
                        {req.review_note}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 13 },

  header: { marginBottom: 16 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontWeight: '700' },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, fontWeight: '700' },

  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  cardSubtitle: { fontSize: 11, marginTop: 2, marginBottom: 14 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  emptyBox: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  emptyIcon: { fontSize: 32, marginBottom: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  emptyText: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  videoList: { gap: 10, paddingBottom: 10 },
  videoCard: {
    width: 140,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  videoCardSelected: {},
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoIcon: { fontSize: 20 },
  existingBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  existingBadgeText: { fontSize: 7, fontWeight: '900' },
  videoExercise: { fontSize: 12, fontWeight: '800' },
  videoSport: { fontSize: 9, fontWeight: '800', marginTop: 1 },
  videoDate: { fontSize: 9, marginTop: 4 },
  videoScore: { fontSize: 10, fontWeight: '900', marginTop: 4 },

  selectionInfo: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  selectionInfoText: { fontSize: 11, fontWeight: '800' },

  detailsInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 90,
    fontSize: 13,
  },
  charCountRow: { alignItems: 'flex-end', marginTop: 4, marginBottom: 12 },
  charCountText: { fontSize: 9 },

  docsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addDocBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addDocText: { fontSize: 10, fontWeight: '800' },

  docDropzone: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  docDropzoneIcon: { fontSize: 24, marginBottom: 4 },
  docDropzoneText: { fontSize: 11, textAlign: 'center' },

  docList: { gap: 8, marginBottom: 16 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  docItemIcon: { fontSize: 18 },
  docItemName: { fontSize: 12, fontWeight: '700' },
  docItemSize: { fontSize: 9, marginTop: 1 },
  removeDocBtn: { padding: 4 },
  removeDocText: { fontSize: 13, fontWeight: '900' },

  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  historySection: { marginTop: 8 },
  sectionHeading: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  emptyHistoryBox: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },

  historyCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyExercise: { fontSize: 14, fontWeight: '800' },
  historyDate: { fontSize: 10, marginTop: 2 },
  historyDetails: { fontSize: 12, lineHeight: 16, marginBottom: 8 },
  officialNotesBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  officialNotesLabel: { fontSize: 10, fontWeight: '800', marginBottom: 2 },
  officialNotesText: { fontSize: 11 },
});