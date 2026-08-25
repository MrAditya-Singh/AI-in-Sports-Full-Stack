/**
 * ATHLETIX — Leaderboard Screen (Phase 6: FULLY IMPLEMENTED)
 * app/(athlete)/leaderboard.tsx
 *
 * Features:
 *  - Sport Filter Toggle Cards (Powerlifting / Calisthenics)
 *  - Exercise Pills selector (Squat, Bench Press, Deadlift, Push-ups, Pull-ups, Handstand)
 *  - Animated Top 3 Rank Podium (🥇 Gold, 🥈 Silver, 🥉 Bronze) with neon glowing borders
 *  - Verification Badge Indicator (`✅ Verified`)
 *  - Full athlete rankings list with scores, locations, and rep counts
 */

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Colors } from '../../constants/colors';
import { SPORTS, findExercise, Sport, Exercise } from '../../constants/sports';
import { LeaderboardItem } from '../../services/leaderboardService';

export default function LeaderboardScreen() {
  const {
    selectedSport,
    setSelectedSport,
    selectedExercise,
    setSelectedExercise,
    items,
    topThree,
    remainingItems,
    isLoading,
    error,
    refreshLeaderboard,
  } = useLeaderboard();

  const activeSportObj = SPORTS.find((s) => s.key === selectedSport);
  const exerciseOptions = activeSportObj ? activeSportObj.exercises : [];

  const handleSportChange = (sportKey: Sport) => {
    setSelectedSport(sportKey);
    setSelectedExercise('all');
  };

  const renderPodiumItem = (item: LeaderboardItem | undefined, rankPos: 1 | 2 | 3) => {
    if (!item) return <View style={[styles.podiumCard, styles.emptyPodium]} />;

    const colorsMap = {
      1: { border: Colors.gold, bg: 'rgba(255, 215, 0, 0.12)', icon: '🥇', label: '1ST' },
      2: { border: Colors.silver, bg: 'rgba(192, 192, 192, 0.12)', icon: '🥈', label: '2ND' },
      3: { border: Colors.bronze, bg: 'rgba(205, 127, 50, 0.12)', icon: '🥉', label: '3RD' },
    };

    const cfg = colorsMap[rankPos];

    return (
      <View
        style={[
          styles.podiumCard,
          { borderColor: cfg.border, backgroundColor: cfg.bg },
          rankPos === 1 && styles.firstPodiumCard,
        ]}
      >
        <Text style={styles.podiumBadgeIcon}>{cfg.icon}</Text>
        <Text style={styles.podiumRankLabel}>{cfg.label}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{item.athlete_name}</Text>

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
          <Text style={styles.scoreSub}>PTS</Text>
        </View>

        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✅ Verified</Text>
          </View>
        )}

        {item.rep_count !== null && item.rep_count !== undefined && (
          <Text style={styles.repText}>{item.rep_count} Reps</Text>
        )}
      </View>
    );
  };

  const renderRankRow = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const actualRank = item.rank || index + 4;
    return (
      <View style={styles.rankRow}>
        <Text style={styles.rankNum}>#{actualRank}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.rowName}>{item.athlete_name}</Text>
            {item.is_verified && (
              <View style={styles.smallVerifiedBadge}>
                <Text style={styles.smallVerifiedText}>✅</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowMeta}>
            {item.athlete_location || 'India'}  ·  {item.exercise.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <View style={styles.rowScoreWrap}>
          <Text style={styles.rowScore}>{item.score.toFixed(1)}</Text>
          {item.rep_count !== null && (
            <Text style={styles.rowReps}>{item.rep_count} reps</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1525']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TALENT LEADERBOARD 🏆</Text>
          <Text style={styles.headerSub}>AI-Scored & Verified Athletes</Text>
        </View>

        {/* ── Sport Selector Cards ── */}
        <View style={styles.sportSelectorRow}>
          {SPORTS.map((s) => {
            const isSelected = selectedSport === s.key;
            return (
              <Pressable
                key={s.key}
                style={[
                  styles.sportTab,
                  isSelected && styles.activeSportTab,
                ]}
                onPress={() => handleSportChange(s.key as Sport)}
              >
                <Text style={styles.sportTabIcon}>{s.icon}</Text>
                <Text style={[styles.sportTabText, isSelected && styles.activeSportTabText]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Exercise Filter Pills ── */}
        <View style={styles.exercisePillsRow}>
          <Pressable
            style={[styles.exPill, selectedExercise === 'all' && styles.activeExPill]}
            onPress={() => setSelectedExercise('all')}
          >
            <Text style={[styles.exPillText, selectedExercise === 'all' && styles.activeExPillText]}>
              All Exercises
            </Text>
          </Pressable>
          {exerciseOptions.map((ex) => {
            const isSel = selectedExercise === ex.key;
            return (
              <Pressable
                key={ex.key}
                style={[styles.exPill, isSel && styles.activeExPill]}
                onPress={() => setSelectedExercise(ex.key as Exercise)}
              >
                <Text style={[styles.exPillText, isSel && styles.activeExPillText]}>
                  {ex.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching live rankings...</Text>
          </View>
        ) : (
          <FlatList
            data={remainingItems}
            keyExtractor={(item, index) => `${item.athlete_id}-${index}`}
            renderItem={renderRankRow}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshLeaderboard} tintColor={Colors.primary} />
            }
            ListHeaderComponent={
              items.length > 0 ? (
                <View style={styles.podiumSection}>
                  <Text style={styles.sectionLabel}>TOP PERFORMERS 👑</Text>
                  <View style={styles.podiumRow}>
                    {/* Rank 2 */}
                    {renderPodiumItem(topThree[1], 2)}
                    {/* Rank 1 (Center, Elevated) */}
                    {renderPodiumItem(topThree[0], 1)}
                    {/* Rank 3 */}
                    {renderPodiumItem(topThree[2], 3)}
                  </View>

                  {remainingItems.length > 0 && (
                    <Text style={[styles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}>
                      RANKED ATHLETES ({items.length})
                    </Text>
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No Ranked Athletes Yet</Text>
                <Text style={styles.emptySub}>
                  Upload an AI-evaluated video in this category to claim the #1 spot!
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
  safe:     { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 1 },
  headerSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  sportSelectorRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  sportTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  activeSportTab: { backgroundColor: `${Colors.primary}20`, borderColor: Colors.primary },
  sportTabIcon:   { fontSize: 18 },
  sportTabText:   { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  activeSportTabText: { color: Colors.primary },

  exercisePillsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  exPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: Colors.border,
  },
  activeExPill: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  exPillText:   { fontSize: 11, color: Colors.textSecondary },
  activeExPillText: { color: '#000', fontWeight: '800' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  podiumSection: { marginBottom: 12 },
  sectionLabel:  { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, fontWeight: '700', marginBottom: 12 },
  podiumRow:     { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },

  podiumCard: {
    flex: 1, borderRadius: 18, padding: 12, alignItems: 'center',
    borderWidth: 1.5, minHeight: 140, justifyContent: 'center',
  },
  firstPodiumCard: { minHeight: 165, elevation: 6 },
  emptyPodium:     { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: Colors.border },

  podiumBadgeIcon: { fontSize: 24, marginBottom: 2 },
  podiumRankLabel: { fontSize: 10, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  podiumName:      { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginVertical: 4, textAlign: 'center' },

  scorePill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  scoreText: { fontSize: 14, fontWeight: '900', color: Colors.secondary },
  scoreSub:  { fontSize: 9, color: Colors.textMuted, fontWeight: '700' },

  verifiedBadge: {
    backgroundColor: `${Colors.secondary}20`, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    marginTop: 6, borderWidth: 1, borderColor: `${Colors.secondary}50`,
  },
  verifiedBadgeText: { color: Colors.secondary, fontSize: 9, fontWeight: '800' },
  repText: { color: Colors.textSecondary, fontSize: 10, marginTop: 4 },

  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  rankNum: { fontSize: 16, fontWeight: '900', color: Colors.primary, width: 32 },
  rowName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  smallVerifiedBadge: { backgroundColor: `${Colors.secondary}20`, borderRadius: 10, padding: 2 },
  smallVerifiedText:  { fontSize: 10 },
  rowMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  rowScoreWrap: { alignItems: 'flex-end' },
  rowScore:     { fontSize: 18, fontWeight: '900', color: Colors.secondary },
  rowReps:      { fontSize: 10, color: Colors.textSecondary },

  emptyBox: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 20,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
