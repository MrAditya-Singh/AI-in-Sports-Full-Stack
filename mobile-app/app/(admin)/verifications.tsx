/**
 * ATHLETIX — Admin Verification Review Screen
 * app/(admin)/verifications.tsx
 *
 * Features:
 * - Dynamic Light & Dark Theme support with ThemeToggle
 * - Pending/approved/rejected request filters
 * - Athlete and video details
 * - Private document signed URLs
 * - Approve and reject actions with reason notes
 * - Pull-to-refresh
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
import { useRouter } from 'expo-router';

import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  getAdminVerificationRequests,
  getVerificationDocuments,
  reviewVerificationRequest,
  type VerificationDocument,
  type VerificationRequestItem,
  type VerificationStatus,
} from '../../services/verificationService';

type StatusFilter = 'all' | VerificationStatus;

const FILTERS: Array<{
  label: string;
  value: StatusFilter;
}> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

function formatExercise(value?: string): string {
  if (!value) return 'Performance';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not available';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }
  return parsedDate.toLocaleString();
}

function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || 'Document';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }
  const value = error as { userMessage?: string; message?: string };
  return value.userMessage ?? value.message ?? fallback;
}

export default function AdminVerificationReviewScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (role && role !== 'admin') {
      router.replace(
        role === 'athlete'
          ? '/(athlete)/dashboard'
          : '/(official)/dashboard',
      );
    }
  }, [role, router]);

  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Documents modal state
  const [docsModalVisible, setDocsModalVisible] = useState(false);
  const [requestDocuments, setRequestDocuments] = useState<VerificationDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminVerificationRequests();
      setRequests(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not load verification requests.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    if (selectedFilter === 'all') return requests;
    return requests.filter((req) => req.status === selectedFilter);
  }, [requests, selectedFilter]);

  const handleOpenReview = (req: VerificationRequestItem, decision: 'approved' | 'rejected') => {
    setSelectedRequest(req);
    setReviewDecision(decision);
    setReviewNotes('');
    setReviewModalVisible(true);
  };

  const handleOpenDocuments = async (req: VerificationRequestItem) => {
    setSelectedRequest(req);
    setDocsModalVisible(true);
    setIsLoadingDocs(true);
    try {
      const docs = await getVerificationDocuments(req.id);
      setRequestDocuments(docs);
    } catch {
      Alert.alert('Error', 'Could not load documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;
    if (reviewDecision === 'rejected' && reviewNotes.trim().length < 3) {
      Alert.alert('Rejection Note Required', 'Please provide a brief reason for rejection.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewVerificationRequest(
        selectedRequest.id,
        {
          status: reviewDecision,
          review_note: reviewNotes.trim() || undefined,
        },
      );
      setReviewModalVisible(false);
      await fetchRequests();
      Alert.alert('Success', `Verification request has been ${reviewDecision}.`);
    } catch (err: unknown) {
      Alert.alert('Review Failed', getErrorMessage(err, 'Failed to update review.'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenDocUrl = (url?: string) => {
    if (url) {
      void Linking.openURL(url);
    }
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
            VERIFICATION AUDIT QUEUE 🛡️
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Inspect Candidate Performance & Certify Authentic Talent
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              style={[
                styles.filterPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                selectedFilter === f.value && [
                  styles.activeFilterPill,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                ],
              ]}
              onPress={() => setSelectedFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: colors.textMuted },
                  selectedFilter === f.value && { color: colors.primary, fontWeight: '900' },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading verification audit queue...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => void fetchRequests()}
                tintColor={colors.primary}
              />
            }
          >
            {filteredRequests.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
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
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No submissions match the current filter selection.
                </Text>
              </View>
            ) : (
              filteredRequests.map((req) => (
                <View
                  key={req.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: colors.cardShadow,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                        {req.athlete?.name || 'Athlete'}
                      </Text>
                      <Text style={[styles.exerciseMeta, { color: colors.primary }]}>
                        {formatExercise(req.video?.exercise)} ({req.video?.sport?.toUpperCase()})
                      </Text>
                      <Text style={[styles.dateMeta, { color: colors.textMuted }]}>
                        Requested {formatDate(req.created_at)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
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
                          styles.statusBadgeText,
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
                    <View
                      style={[
                        styles.detailsBox,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.detailsLabel, { color: colors.textMuted }]}>
                        Athlete Statement:
                      </Text>
                      <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                        {req.details}
                      </Text>
                    </View>
                  ) : null}

                  {req.review_note ? (
                    <View
                      style={[
                        styles.notesBox,
                        {
                          backgroundColor: `${colors.primary}12`,
                          borderColor: `${colors.primary}30`,
                        },
                      ]}
                    >
                      <Text style={[styles.notesLabel, { color: colors.primary }]}>
                        Audit Note:
                      </Text>
                      <Text style={[styles.notesText, { color: colors.textPrimary }]}>
                        {req.review_note}
                      </Text>
                    </View>
                  ) : null}

                  {/* Actions */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <Pressable
                      style={[
                        styles.docsBtn,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleOpenDocuments(req)}
                    >
                      <Text style={[styles.docsBtnText, { color: colors.primary }]}>
                        📎 View Documents
                      </Text>
                    </Pressable>

                    {req.status === 'pending' && (
                      <View style={styles.decisionBtns}>
                        <Pressable
                          style={[
                            styles.rejectBtn,
                            {
                              backgroundColor: `${colors.error}15`,
                              borderColor: `${colors.error}40`,
                            },
                          ]}
                          onPress={() => handleOpenReview(req, 'rejected')}
                        >
                          <Text style={[styles.rejectBtnText, { color: colors.error }]}>
                            ✕ Reject
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.approveBtn,
                            {
                              backgroundColor: `${colors.secondary}20`,
                              borderColor: `${colors.secondary}50`,
                            },
                          ]}
                          onPress={() => handleOpenReview(req, 'approved')}
                        >
                          <Text style={[styles.approveBtnText, { color: colors.secondary }]}>
                            ✓ Approve
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Review Modal */}
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {reviewDecision === 'approved' ? '✓ Approve Verification' : '✕ Reject Verification'}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Athlete: {selectedRequest?.athlete?.name} · {formatExercise(selectedRequest?.video?.exercise)}
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Decision Notes (Optional for approval, mandatory for rejection):
              </Text>

              <TextInput
                value={reviewNotes}
                onChangeText={setReviewNotes}
                placeholder="Enter feedback or explanation..."
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <View style={styles.modalActionRow}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setReviewModalVisible(false)}
                  disabled={isSubmittingReview}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: reviewDecision === 'approved' ? colors.secondary : colors.error,
                    },
                  ]}
                  onPress={handleSubmitReview}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.confirmBtnText, { color: colors.textInverse }]}>
                      Confirm {reviewDecision.toUpperCase()}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Documents Modal */}
        <Modal
          visible={docsModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDocsModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.docsModalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Attached Documents
                </Text>
                <Pressable onPress={() => setDocsModalVisible(false)}>
                  <Text style={[styles.closeModalText, { color: colors.textPrimary }]}>
                    ✕
                  </Text>
                </Pressable>
              </View>

              {isLoadingDocs ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : requestDocuments.length === 0 ? (
                <Text style={[styles.noDocsText, { color: colors.textMuted }]}>
                  No documents attached to this request.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  {requestDocuments.map((doc) => (
                    <Pressable
                      key={doc.path}
                      style={[
                        styles.docCard,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleOpenDocUrl(doc.signed_url)}
                    >
                      <Text style={styles.docIcon}>📄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.docName, { color: colors.textPrimary }]}>
                          {getFileName(doc.path)}
                        </Text>
                        <Text style={[styles.docMeta, { color: colors.primary }]}>
                          Tap to view / download document ↗
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  activeFilterPill: {},
  filterPillText: { fontSize: 11, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  athleteName: { fontSize: 15, fontWeight: '900' },
  exerciseMeta: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  dateMeta: { fontSize: 10, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 9, fontWeight: '900' },

  detailsBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  detailsLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  detailsText: { fontSize: 11, lineHeight: 15 },

  notesBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  notesText: { fontSize: 11 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  docsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  docsBtnText: { fontSize: 11, fontWeight: '700' },
  decisionBtns: { flexDirection: 'row', gap: 6 },
  rejectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectBtnText: { fontSize: 11, fontWeight: '800' },
  approveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveBtnText: { fontSize: 11, fontWeight: '800' },

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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSub: { fontSize: 12, marginTop: 2, marginBottom: 14 },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 16,
  },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700' },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmBtnText: { fontSize: 12, fontWeight: '900' },

  docsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeModalText: { fontSize: 16, fontWeight: '800' },
  noDocsText: { fontSize: 12, marginVertical: 16, textAlign: 'center' },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  docIcon: { fontSize: 20 },
  docName: { fontSize: 12, fontWeight: '700' },
  docMeta: { fontSize: 10, marginTop: 2 },
});