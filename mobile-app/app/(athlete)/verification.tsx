/**
 * ATHLETIX — Athlete Verification Request Screen (Minimalist Dual-Tone Stream)
 * app/(athlete)/verification.tsx
 *
 * Design:
 * - Minimalist Stream flow (No Bento Grids)
 * - Exact Dual-Tone Palette (Ivory Cream #F7F4EE & Jet Obsidian #111111)
 * - Innovative Vector Icons
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

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import NeomorphicButton from '../../components/NeomorphicButton';
import ThemeToggle from '../../components/ThemeToggle';
import { useVerification } from '../../hooks/useVerification';
import { useTheme } from '../../hooks/useTheme';

const MAX_DOCUMENTS = 5;
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatExercise(exercise?: string): string {
  if (!exercise) return 'Performance';
  return exercise
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFileSize(size?: number): string {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
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
    pendingCount,
    approvedCount,
    rejectedCount,
    refresh,
    submitRequest,
  } = useVerification(params.videoId);

  const [details, setDetails] = useState('');
  const [documents, setDocuments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [submitBanner, setSubmitBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedVideo = useMemo(
    () => completedVideos.find((video) => video.id === selectedVideoId) ?? null,
    [completedVideos, selectedVideoId],
  );

  async function handlePickDocuments() {
    setSubmitBanner(null);
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
          `Document "${oversized.name}" exceeds the 10 MB limit.`,
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
    setSubmitBanner(null);

    if (!selectedVideoId) {
      const msg = 'Please select a completed performance video to verify.';
      setSubmitBanner({ type: 'error', text: msg });
      Alert.alert('Video selection required', msg);
      return;
    }

    if (!details.trim()) {
      const msg = 'Please enter verification details or reason for review.';
      setSubmitBanner({ type: 'error', text: msg });
      Alert.alert('Details required', msg);
      return;
    }

    if (documents.length === 0) {
      const msg = 'Please attach at least one supporting document (Image or PDF).';
      setSubmitBanner({ type: 'error', text: msg });
      Alert.alert('Document required', msg);
      return;
    }

    try {
      await submitRequest(details.trim(), documents);

      setDetails('');
      setDocuments([]);

      const successMsg = 'Verification request submitted for official review.';
      setSubmitBanner({ type: 'success', text: successMsg });
      Alert.alert('Request submitted', successMsg);

      await refresh();
    } catch (caughtError: any) {
      const errMsg =
        caughtError?.userMessage ??
        caughtError?.message ??
        'Could not submit verification request. Please try again.';
      setSubmitBanner({ type: 'error', text: errMsg });
      Alert.alert('Submission failed', errMsg);
    }
  }

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        >
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
                Athlete Trust Verification
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Official Performance & Badge Certification
              </Text>
            </View>
            <ThemeToggle compact />
          </View>

          {/* ── Status Metrics Stream (No Bento, 3 Clean Stream Cells) ── */}
          <View style={styles.metricsStreamRow}>
            <MinimalCard style={{ flex: 1, marginRight: 6 }} contentStyle={{ padding: 12, alignItems: 'center' }}>
              <InnovativeIcon name="clock" size={16} color={colors.textPrimary} />
              <Text style={[styles.metricStreamVal, { color: colors.textPrimary }]}>
                {pendingCount}
              </Text>
              <Text style={[styles.metricStreamLabel, { color: colors.textMuted }]}>
                PENDING
              </Text>
            </MinimalCard>

            <MinimalCard style={{ flex: 1, marginHorizontal: 3 }} contentStyle={{ padding: 12, alignItems: 'center' }}>
              <InnovativeIcon name="check-circle" size={16} color={colors.textPrimary} />
              <Text style={[styles.metricStreamVal, { color: colors.textPrimary }]}>
                {approvedCount}
              </Text>
              <Text style={[styles.metricStreamLabel, { color: colors.textMuted }]}>
                APPROVED
              </Text>
            </MinimalCard>

            <MinimalCard style={{ flex: 1, marginLeft: 6 }} contentStyle={{ padding: 12, alignItems: 'center' }}>
              <InnovativeIcon name="alert-circle" size={16} color={colors.textMuted} />
              <Text style={[styles.metricStreamVal, { color: colors.textMuted }]}>
                {rejectedCount}
              </Text>
              <Text style={[styles.metricStreamLabel, { color: colors.textMuted }]}>
                REJECTED
              </Text>
            </MinimalCard>
          </View>

          {/* ── Submission Stream Card ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            NEW VERIFICATION REQUEST
          </Text>

          <MinimalCard contentStyle={{ padding: 18 }}>
            {/* Step 1: Video Selection */}
            <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
              1. SELECT COMPLETED ATTEMPT
            </Text>

            {completedVideos.length === 0 ? (
              <View style={[styles.emptyVideoBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#EFECE4' }]}>
                <InnovativeIcon name="video" size={24} color={colors.textMuted} />
                <Text style={[styles.emptyVideoText, { color: colors.textPrimary }]}>
                  No Completed Videos Found
                </Text>
                <Text style={[styles.emptyVideoSub, { color: colors.textMuted }]}>
                  Upload and analyze a video first to request verification.
                </Text>
                <NeomorphicButton
                  title="Upload Video Now"
                  size="sm"
                  onPress={() => router.push('/(athlete)/upload' as any)}
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScroll}>
                {completedVideos.map((video) => {
                  const isSelected = video.id === selectedVideoId;
                  return (
                    <Pressable
                      key={video.id}
                      onPress={() => setSelectedVideoId(video.id)}
                      style={({ pressed }) => [
                        styles.videoPill,
                        {
                          backgroundColor: isSelected
                            ? isDark ? colors.primary : '#111111'
                            : isDark ? 'rgba(255,255,255,0.04)' : '#EFECE4',
                          borderColor: isSelected ? colors.primary : colors.border,
                          transform: pressed ? [{ scale: 0.97 }] : [{ scale: 1 }],
                        },
                      ]}
                    >
                      <InnovativeIcon
                        name="activity"
                        size={16}
                        color={isSelected ? '#F7F4EE' : colors.textPrimary}
                      />
                      <View>
                        <Text
                          style={[
                            styles.videoPillTitle,
                            { color: isSelected ? '#F7F4EE' : colors.textPrimary },
                          ]}
                        >
                          {formatExercise(video.exercise)}
                        </Text>
                        <Text
                          style={[
                            styles.videoPillSub,
                            { color: isSelected ? 'rgba(247,244,238,0.7)' : colors.textMuted },
                          ]}
                        >
                          {(video.sport || 'POWERLIFTING').toUpperCase()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {selectedVideo && (
              <View
                style={[
                  styles.selectedBanner,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFECE4',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.selectedBannerText, { color: colors.textPrimary }]}>
                  Selected: <Text style={{ fontWeight: '800' }}>{formatExercise(selectedVideo.exercise)} · {(selectedVideo.sport || 'ATHLETICS').toUpperCase()}</Text>
                </Text>
              </View>
            )}

            {/* Step 2: Verification Details */}
            <Text style={[styles.stepLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              2. VERIFICATION DETAILS / REASON
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Official State Championship attempt, ID verification, or competition certificate..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />

            {/* Step 3: Supporting Documents */}
            <View style={styles.docHeaderRow}>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                3. SUPPORTING DOCUMENTS ({documents.length}/{MAX_DOCUMENTS})
              </Text>
              <Pressable
                onPress={handlePickDocuments}
                style={[
                  styles.addDocBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                    borderColor: colors.border,
                  },
                ]}
              >
                <InnovativeIcon name="plus" size={12} color={colors.textPrimary} />
                <Text style={[styles.addDocText, { color: colors.textPrimary }]}>Add Document</Text>
              </Pressable>
            </View>

            {documents.length > 0 && (
              <View style={styles.docsList}>
                {documents.map((doc, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.docChip,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFECE4',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <InnovativeIcon name="file-text" size={16} color={colors.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.docSize, { color: colors.textMuted }]}>
                        {formatFileSize(doc.size)}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleRemoveDocument(idx)}>
                      <InnovativeIcon name="trash" size={14} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Submit Banner */}
            {submitBanner && (
              <View
                style={[
                  styles.submitBannerBox,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                    borderColor: colors.border,
                  },
                ]}
              >
                <InnovativeIcon
                  name={submitBanner.type === 'success' ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={[styles.submitBannerText, { color: colors.textPrimary }]}>
                  {submitBanner.text}
                </Text>
              </View>
            )}

            {/* Submit Action */}
            <NeomorphicButton
              title={isSubmitting ? 'SUBMITTING REQUEST...' : 'SUBMIT FOR OFFICIAL REVIEW'}
              icon={<InnovativeIcon name="shield-check" size={16} color={isDark ? '#FFFFFF' : '#F7F4EE'} />}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!selectedVideoId || isSubmitting}
              variant="primary"
              size="lg"
              style={{ marginTop: 18 }}
            />
          </MinimalCard>

          {/* ── Verification History Stream ── */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            VERIFICATION HISTORY ({requests.length})
          </Text>

          {requests.length === 0 ? (
            <MinimalCard contentStyle={{ padding: 22, alignItems: 'center' }}>
              <InnovativeIcon name="file-text" size={28} color={colors.textMuted} />
              <Text style={[styles.emptyVideoText, { color: colors.textPrimary, marginTop: 8 }]}>
                No Verification Requests Filed
              </Text>
              <Text style={[styles.emptyVideoSub, { color: colors.textMuted }]}>
                Submitted requests and official review decisions will appear here.
              </Text>
            </MinimalCard>
          ) : (
            <View style={{ gap: 8, marginBottom: 30 }}>
              {requests.map((req) => (
                <MinimalCard key={req.id} contentStyle={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[styles.reqTitle, { color: colors.textPrimary }]}>
                      {formatExercise(req.exercise || req.video?.exercise)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            req.status === 'approved'
                              ? isDark ? 'rgba(57, 255, 20, 0.12)' : '#111111'
                              : isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFECE4',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              req.status === 'approved'
                                ? isDark ? colors.secondary : '#F7F4EE'
                                : colors.textPrimary,
                          },
                        ]}
                      >
                        {req.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reqDetails, { color: colors.textSecondary }]} numberOfLines={2}>
                    {req.details}
                  </Text>

                  {req.review_note && (
                    <View
                      style={[
                        styles.reviewNoteBox,
                        { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#EFECE4', borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.reviewNoteLabel, { color: colors.textMuted }]}>
                        Official Note:
                      </Text>
                      <Text style={[styles.reviewNoteText, { color: colors.textPrimary }]}>
                        {req.review_note}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.reqDate, { color: colors.textMuted }]}>
                    Submitted {new Date(req.created_at).toLocaleDateString()}
                  </Text>
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
  metricsStreamRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricStreamVal: { fontSize: 18, fontWeight: '900', marginVertical: 4 },
  metricStreamLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyVideoBox: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyVideoText: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  emptyVideoSub: { fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  videoScroll: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  videoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    marginRight: 8,
  },
  videoPillTitle: { fontSize: 13, fontWeight: '800' },
  videoPillSub: { fontSize: 10, fontWeight: '700' },
  selectedBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 6,
  },
  selectedBannerText: { fontSize: 12, fontWeight: '600' },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  addDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addDocText: { fontSize: 11, fontWeight: '800' },
  docsList: { gap: 6, marginBottom: 8 },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  docName: { fontSize: 12, fontWeight: '700' },
  docSize: { fontSize: 10, fontWeight: '500' },
  submitBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  submitBannerText: { fontSize: 12, fontWeight: '700', flex: 1 },
  reqTitle: { fontSize: 14, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  reqDetails: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  reviewNoteBox: { padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  reviewNoteLabel: { fontSize: 10, fontWeight: '700' },
  reviewNoteText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  reqDate: { fontSize: 10, fontWeight: '500', marginTop: 8 },
});