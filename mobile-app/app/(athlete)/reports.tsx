/**
 * ATHLETIX — AI Performance Reports & Assessments Screen
 * app/(athlete)/reports.tsx
 *
 * Theme-aware (Light Theme Cream #F7F4EE & Dark Theme #0A0E1A) with vector icons.
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

import MinimalCard from '../../components/MinimalCard';
import InnovativeIcon from '../../components/InnovativeIcon';
import ThemeToggle from '../../components/ThemeToggle';
import { useAssessments } from '../../hooks/useAssessments';
import { useTheme } from '../../hooks/useTheme';
import { AssessmentRecord } from '../../services/videoService';

export default function MyAIReportsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  const renderAssessmentCard = ({ item }: { item: AssessmentRecord }) => {
    const isExpanded = expandedReportId === item.id;
    const exerciseName = (item.videos?.exercise || 'Performance').replace(/_/g, ' ').toUpperCase();
    const sportName = (item.videos?.sport || 'ATHLETICS').toUpperCase();
    const scoreVal = Math.round(item.score || 0);

    return (
      <MinimalCard contentStyle={{ padding: 16 }}>
        <Pressable onPress={() => toggleExpand(item.id)}>
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4' },
              ]}
            >
              <InnovativeIcon name="bar-chart" size={20} color={colors.textPrimary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.exerciseTitle, { color: colors.textPrimary }]}>
                {exerciseName}
              </Text>
              <Text style={[styles.exerciseMeta, { color: colors.textMuted }]}>
                {sportName} · {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.scoreWrap}>
              <Text style={[styles.scoreVal, { color: colors.textPrimary }]}>
                {scoreVal}
              </Text>
              <Text style={[styles.scoreSub, { color: colors.textMuted }]}>
                AI SCORE
              </Text>
            </View>
          </View>
        </Pressable>

        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
            {/* Strengths */}
            {item.strengths && item.strengths.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                  FORM STRENGTHS
                </Text>
                {item.strengths.map((str, idx) => (
                  <Text key={idx} style={[styles.feedbackItem, { color: colors.textSecondary }]}>
                    • {str}
                  </Text>
                ))}
              </View>
            )}

            {/* Form Corrections */}
            {item.weaknesses && item.weaknesses.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                  FORM CORRECTIONS DETECTED
                </Text>
                {item.weaknesses.map((w, idx) => (
                  <Text key={idx} style={[styles.feedbackItem, { color: colors.textSecondary }]}>
                    • {w}
                  </Text>
                ))}
              </View>
            )}

            {/* AI Suggestions */}
            {item.suggestions && item.suggestions.length > 0 && (
              <View style={styles.feedbackBlock}>
                <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>
                  AI COACH SUGGESTIONS
                </Text>
                {item.suggestions.map((sug, idx) => (
                  <Text key={idx} style={[styles.feedbackItem, { color: colors.textSecondary }]}>
                    • {sug}
                  </Text>
                ))}
              </View>
            )}

            <Pressable
              style={[
                styles.verifyActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EFECE4',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/(athlete)/verification',
                  params: { videoId: item.video_id },
                } as any);
              }}
            >
              <InnovativeIcon name="shield-check" size={14} color={colors.textPrimary} />
              <Text style={[styles.verifyActionBtnText, { color: colors.textPrimary }]}>
                Submit For Official Verification
              </Text>
            </Pressable>
          </View>
        )}
      </MinimalCard>
    );
  };

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
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
              AI Performance Reports
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Biomechanics Breakdown & Form Scores
            </Text>
          </View>
          <ThemeToggle compact />
        </View>

        {/* Overview Banner */}
        <MinimalCard contentStyle={{ padding: 16 }}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewMetric}>
              <Text style={[styles.overviewVal, { color: colors.textPrimary }]}>
                {assessments.length}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                EVALUATIONS
              </Text>
            </View>

            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />

            <View style={styles.overviewMetric}>
              <Text style={[styles.overviewVal, { color: colors.textPrimary }]}>
                {avgScore > 0 ? avgScore : '—'}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                AVG SCORE
              </Text>
            </View>

            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />

            <View style={styles.overviewMetric}>
              <Text style={[styles.overviewVal, { color: colors.textPrimary }]}>
                {assessments.filter((a) => a.score >= 85).length}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                ELITE (85+)
              </Text>
            </View>
          </View>
        </MinimalCard>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'powerlifting', 'calisthenics'] as const).map((key) => {
            const isSelected = selectedSportFilter === key;
            const labels = { all: 'All Movements', powerlifting: 'Powerlifting', calisthenics: 'Calisthenics' };
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? isDark ? colors.primary : '#111111'
                      : isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedSportFilter(key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#F7F4EE' : colors.textMuted },
                  ]}
                >
                  {labels[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredAssessments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssessmentCard}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refreshAssessments}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <MinimalCard contentStyle={{ padding: 24, alignItems: 'center' }}>
                <InnovativeIcon name="bar-chart" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textPrimary, marginTop: 8 }]}>
                  No Assessment Reports Available
                </Text>
              </MinimalCard>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
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
  overviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overviewMetric: { alignItems: 'center' },
  overviewVal: { fontSize: 22, fontWeight: '900' },
  overviewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginTop: 2 },
  overviewDivider: { width: 1, height: 28 },
  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exerciseTitle: { fontSize: 14, fontWeight: '800' },
  exerciseMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  scoreWrap: { alignItems: 'flex-end' },
  scoreVal: { fontSize: 20, fontWeight: '900' },
  scoreSub: { fontSize: 9, fontWeight: '800' },
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 10 },
  feedbackBlock: { gap: 4 },
  feedbackTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  feedbackItem: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  verifyActionBtnText: { fontSize: 12, fontWeight: '800' },
  emptyText: { fontSize: 14, fontWeight: '700' },
});
