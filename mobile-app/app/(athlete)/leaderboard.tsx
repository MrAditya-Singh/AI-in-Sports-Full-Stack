/**
 * ATHLETIX — Talent Leaderboard (Minimalist Dual-Tone Stream)
 * app/(athlete)/leaderboard.tsx
 *
 * Design:
 * - Minimalist stream ranking (No Bento Grids)
 * - Exact Dual-Tone Cream (#F7F4EE) & Obsidian (#111111) palette
 * - Innovative Vector Icons
 */

import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { SPORTS, Sport } from '../../constants/sports';
import { useTheme } from '../../hooks/useTheme';
import { LeaderboardItem } from '../../services/leaderboardService';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    selectedSport,
    setSelectedSport,
    selectedExercise,
    setSelectedExercise,
    topThree,
    remainingItems,
    isLoading,
    refreshLeaderboard,
  } = useLeaderboard();

  const activeSportObj = SPORTS.find((s) => s.key === selectedSport);
  const exerciseOptions = activeSportObj ? activeSportObj.exercises : [];

  const handleSportChange = (sportKey: Sport) => {
    setSelectedSport(sportKey);
    setSelectedExercise('all');
  };

  const renderTopRankCard = (item: LeaderboardItem | undefined, rankPos: 1 | 2 | 3) => {
    if (!item) return null;

    const rankLabel = rankPos === 1 ? '1ST' : rankPos === 2 ? '2ND' : '3RD';

    return (
      <MinimalCard
        key={`top-${rankPos}`}
        variant={rankPos === 1 && !isDark ? 'darkBlock' : 'elevated'}
        contentStyle={{ padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor:
                  rankPos === 1
                    ? isDark ? 'rgba(255, 215, 0, 0.2)' : '#FFFFFF'
                    : isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFECE4',
              },
            ]}
          >
            <InnovativeIcon
              name={rankPos === 1 ? 'trophy' : 'medal'}
              size={16}
              color={rankPos === 1 ? (isDark ? '#FFD700' : '#111111') : colors.textPrimary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={[
                  styles.topAthleteName,
                  { color: rankPos === 1 && !isDark ? '#F7F4EE' : colors.textPrimary },
                ]}
              >
                {item.athlete_name}
              </Text>
              {item.is_verified && (
                <InnovativeIcon
                  name="shield-check"
                  size={13}
                  color={rankPos === 1 && !isDark ? '#F7F4EE' : colors.primary}
                />
              )}
            </View>
            <Text
              style={[
                styles.topAthleteMeta,
                { color: rankPos === 1 && !isDark ? 'rgba(247,244,238,0.7)' : colors.textMuted },
              ]}
            >
              {rankLabel} RANK · {item.athlete_location || 'India'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text
              style={[
                styles.topScoreVal,
                { color: rankPos === 1 && !isDark ? '#F7F4EE' : colors.textPrimary },
              ]}
            >
              {item.score.toFixed(1)}
            </Text>
            <Text
              style={[
                styles.topScoreSub,
                { color: rankPos === 1 && !isDark ? 'rgba(247,244,238,0.7)' : colors.textMuted },
              ]}
            >
              AI SCORE
            </Text>
          </View>
        </View>
      </MinimalCard>
    );
  };

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                National Talent Leaderboard
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                Verified Global & National Athlete Rankings
              </Text>
            </View>
          </View>
          <ThemeToggle compact />
        </View>

        {/* Sport Selector Chips */}
        <View style={styles.sportRow}>
          {SPORTS.map((s) => {
            const isSelected = selectedSport === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => handleSportChange(s.key)}
                style={({ pressed }) => [
                  styles.sportChip,
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
                  name={s.key === 'powerlifting' ? 'dumbell' : 'activity'}
                  size={16}
                  color={isSelected ? '#F7F4EE' : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.sportChipText,
                    { color: isSelected ? '#F7F4EE' : colors.textPrimary },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Exercise Movement Stream */}
        <View style={styles.exerciseRow}>
          <Pressable
            onPress={() => setSelectedExercise('all')}
            style={[
              styles.exercisePill,
              {
                backgroundColor:
                  selectedExercise === 'all'
                    ? isDark ? 'rgba(255,255,255,0.1)' : '#111111'
                    : isDark ? 'transparent' : '#FFFFFF',
                borderColor: selectedExercise === 'all' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.exercisePillText,
                { color: selectedExercise === 'all' ? '#F7F4EE' : colors.textMuted },
              ]}
            >
              All Movements
            </Text>
          </Pressable>

          {exerciseOptions.map((ex) => {
            const isSelected = selectedExercise === ex.key;
            return (
              <Pressable
                key={ex.key}
                onPress={() => setSelectedExercise(ex.key)}
                style={[
                  styles.exercisePill,
                  {
                    backgroundColor: isSelected
                      ? isDark ? 'rgba(255,255,255,0.1)' : '#111111'
                      : isDark ? 'transparent' : '#FFFFFF',
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.exercisePillText,
                    { color: isSelected ? '#F7F4EE' : colors.textMuted },
                  ]}
                >
                  {ex.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Top 3 Podium Stream */}
        <View style={{ marginBottom: 12 }}>
          {renderTopRankCard(topThree[0], 1)}
          {renderTopRankCard(topThree[1], 2)}
          {renderTopRankCard(topThree[2], 3)}
        </View>

        {/* Ranked Athletes List */}
        <FlatList
          data={remainingItems}
          keyExtractor={(item, idx) => item.athlete_id || `rank-${idx}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshLeaderboard}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => {
            const actualRank = item.rank || index + 4;
            return (
              <MinimalCard contentStyle={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={[styles.rankNumber, { color: colors.textMuted }]}>
                    #{actualRank}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.athleteName, { color: colors.textPrimary }]}>
                        {item.athlete_name}
                      </Text>
                      {item.is_verified && (
                        <InnovativeIcon name="shield-check" size={13} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.athleteMeta, { color: colors.textMuted }]}>
                      {item.athlete_location || 'India'} · {(item.exercise || 'ATHLETICS').replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.athleteScore, { color: colors.textPrimary }]}>
                      {item.score.toFixed(1)}
                    </Text>
                    {item.rep_count !== null && (
                      <Text style={[styles.athleteReps, { color: colors.textMuted }]}>
                        {item.rep_count} reps
                      </Text>
                    )}
                  </View>
                </View>
              </MinimalCard>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, fontWeight: '500' },
  sportRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sportChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  sportChipText: { fontSize: 13, fontWeight: '800' },
  exerciseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  exercisePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  exercisePillText: { fontSize: 11, fontWeight: '700' },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAthleteName: { fontSize: 14, fontWeight: '800' },
  topAthleteMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  topScoreVal: { fontSize: 18, fontWeight: '900' },
  topScoreSub: { fontSize: 9, fontWeight: '800' },
  rankNumber: { fontSize: 14, fontWeight: '900', width: 32 },
  athleteName: { fontSize: 14, fontWeight: '800' },
  athleteMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  athleteScore: { fontSize: 16, fontWeight: '900' },
  athleteReps: { fontSize: 10, fontWeight: '600' },
});
