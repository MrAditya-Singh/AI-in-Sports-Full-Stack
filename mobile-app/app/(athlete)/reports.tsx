/**
 * ATHLETIX — AI Performance Reports & Assessments Screen (Phase 4/5: FULLY IMPLEMENTED)
 * app/(athlete)/reports.tsx
 *
 * Professional CUJU-style assessment performance breakdown:
 *  - Overview Performance Gauge & Average Score
 *  - Sport Filter Tabs (All / Powerlifting / Calisthenics)
 *  - Expandable Report Cards with 0-100 Score Badge
 *  - Strengths (Green), Weaknesses (Red), and Proactive AI Coaching Suggestions (Amber)
 *  - Rep Count counters for Calisthenics
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAssessments } from '../../hooks/useAssessments';
import { Colors } from '../../constants/colors';
import { AssessmentRecord } from '../../services/videoService';

export default function MyAIReportsScreen() {
  const router = useRouter();
  const { assessments, isLoading, refreshAssessments } = useAssessments();

  const [selectedSportFilter, setSelectedSportFilter] = useState<'all' | 'powerlifting' | 'calisthenics'>('all');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const filteredAssessments = assessments.filter((a) => {
    if (selectedSportFilter === 'all') return true;
    const sport = a.videos?.sport?.toLowerCase() || '';
    return sport === selectedSportFilter;
  });

  const avgScore =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length)
      : 0;

  const toggleExpand = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return Colors.secondary; // Neon Green
    if (score >= 70) return Colors.primary;   // Cyan Blue
    return Colors.warning;                     // Amber Gold
  };

  const renderAssessmentCard = ({ item }: { item: AssessmentRecord }) => {
    const isExpanded = expandedReportId === item.id;
    const scoreColor = getScoreColor(item.score);
    const exerciseName = (item.videos?.exercise || 'Exercise').toUpperCase().replace('_', ' ');
    const sportName = (item.videos?.sport || 'Sport').toUpperCase();

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.cardMainRow}>
          {/* Score Badge */}
          <View style={[styles.scoreBadge, { borderColor: scoreColor, backgroundColor: `${scoreColor}15` }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{Math.round(item.score)}</Text>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>SCORE</Text>
          </View>

          {/* Title & Metadata */}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.exerciseTitle}>{exerciseName}</Text>
              {item.rep_count !== null && item.rep_count !== undefined && (
                <View style={styles.repChip}>
                  <Text style={styles.repChipText}>{item.rep_count} REPS</Text>
                </View>
              )}
            </View>
            <Text style={styles.sportBadgeText}>{sportName}</Text>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {/* Expandable Detailed Breakdown */}
        {isExpanded && (
          <View style={styles.expandedSection}>

            {/* 🟢 Strengths */}
            {item.strengths && item.strengths.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={styles.feedbackTitleGreen}>🟢 FORM STRENGTHS</Text>
                {item.strengths.map((str, idx) => (
                  <Text key={idx} style={styles.feedbackItem}>• {str}</Text>
                ))}
              </View>
            )}

            {/* 🔴 Areas for Improvement */}
            {item.weaknesses && item.weaknesses.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={styles.feedbackTitleRed}>🔴 FORM CORRECTIONS DETECTED</Text>
                {item.weaknesses.map((w, idx) => (
                  <Text key={idx} style={styles.feedbackItem}>• {w}</Text>
                ))}
              </View>
            )}

            {/* 💡 AI Coach Suggestions */}
            {item.suggestions && item.suggestions.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={styles.feedbackTitleAmber}>💡 AI COACH DRILLS & SUGGESTIONS</Text>
                {item.suggestions.map((sug, idx) => (
                  <Text key={idx} style={styles.feedbackItem}>• {sug}</Text>
                ))}
              </View>
            )}

            {/* 🛡️ Submit for Verification Action */}
            <Pressable
              style={styles.verifyActionBtn}
              onPress={() => {
                router.push({
                  pathname: '/(athlete)/verification',
                  params: { videoId: item.video_id },
                } as any);
              }}
            >
              <Text style={styles.verifyActionBtnText}>
                Submit For Official Verification 🛡️
              </Text>
            </Pressable>

          </View>
        )}
      </Pressable>
    );

  };

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1424']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>

        {/* ── Top Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>MY AI PERFORMANCE REPORTS 🎯</Text>
          <Text style={styles.subtitle}>Form Breakdown, Keypoint Angles & Coaching Cues</Text>
        </View>

        {/* ── Overview Banner ── */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewMetric}>
            <Text style={styles.overviewVal}>{assessments.length}</Text>
            <Text style={styles.overviewLabel}>Reports Evaluated</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewMetric}>
            <Text style={[styles.overviewVal, { color: getScoreColor(avgScore) }]}>
              {avgScore > 0 ? avgScore : '—'}
            </Text>
            <Text style={styles.overviewLabel}>Average AI Score</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewMetric}>
            <Text style={[styles.overviewVal, { color: Colors.secondary }]}>
              {assessments.filter((a) => a.score >= 85).length}
            </Text>
            <Text style={styles.overviewLabel}>Elite Attempts (85+)</Text>
          </View>
        </View>

        {/* ── Filter Pills ── */}
        <View style={styles.filterRow}>
          {(['all', 'powerlifting', 'calisthenics'] as const).map((key) => {
            const isSelected = selectedSportFilter === key;
            const labels = { all: 'All Sports', powerlifting: '🏋️ Powerlifting', calisthenics: '🤸 Calisthenics' };
            return (
              <Pressable
                key={key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedSportFilter(key)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {labels[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Reports List ── */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching AI assessment history...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAssessments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssessmentCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshAssessments} tintColor={Colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>No AI Reports Found</Text>
                <Text style={styles.emptySub}>
                  Upload an exercise video attempt to generate your first BlazePose form evaluation!
                </Text>
                <Pressable
                  style={styles.emptyCta}
                  onPress={() => router.push('/(athlete)/upload' as any)}
                >
                  <Text style={styles.emptyCtaText}>🎬 Upload Video Attempt</Text>
                </Pressable>
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
  safe:     { flex: 1 },

  header:   { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn:  { marginBottom: 6 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  overviewCard: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    marginHorizontal: 20, marginVertical: 12, backgroundColor: Colors.surface,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  overviewMetric:  { alignItems: 'center' },
  overviewVal:     { fontSize: 22, fontWeight: '900', color: Colors.primary },
  overviewLabel:   { fontSize: 9, color: Colors.textMuted, marginTop: 2, fontWeight: '700' },
  overviewDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive:     { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  filterPillText:       { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  filterPillTextActive: { color: Colors.primary },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  cardMainRow: { flexDirection: 'row', alignItems: 'center' },
  scoreBadge: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreValue: { fontSize: 18, fontWeight: '900' },
  scoreLabel: { fontSize: 8, fontWeight: '800' },

  exerciseTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  repChip: {
    backgroundColor: `${Colors.secondary}20`, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: `${Colors.secondary}40`,
  },
  repChipText:    { fontSize: 9, color: Colors.secondary, fontWeight: '800' },
  sportBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  dateText:       { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  expandIcon:     { fontSize: 12, color: Colors.textMuted, marginLeft: 8 },

  expandedSection: {
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 12,
  },
  feedbackBlock:      { gap: 4 },
  feedbackTitleGreen: { fontSize: 10, fontWeight: '800', color: Colors.secondary, letterSpacing: 1 },
  feedbackTitleRed:   { fontSize: 10, fontWeight: '800', color: Colors.error, letterSpacing: 1 },
  feedbackTitleAmber: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 1 },
  feedbackItem:       { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, paddingLeft: 4 },

  verifyActionBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: `${Colors.secondary}18`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}50`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyActionBtnText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 12 },

  emptyBox: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 20,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyCta: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  emptyCtaText: { color: '#000', fontSize: 12, fontWeight: '800' },
});
