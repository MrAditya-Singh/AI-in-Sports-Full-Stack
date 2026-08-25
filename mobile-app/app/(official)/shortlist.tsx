/**
 * ATHLETIX — Official Shortlist Management Screen (Phase 6: FULLY IMPLEMENTED)
 * app/(official)/shortlist.tsx
 *
 * Features:
 *  - View bookmarked top talent
 *  - Filter by sport (All / Powerlifting / Calisthenics)
 *  - Remove athlete from shortlist action
 *  - Enriched athlete profile cards (Location, Bio, Specs)
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { useScouting } from '../../hooks/useScouting';
import { Colors } from '../../constants/colors';
import { ShortlistItem } from '../../services/scoutingService';

export default function MyShortlistScreen() {
  const router = useRouter();
  const { shortlist, isLoading, toggleShortlist, actionLoadingId, refreshScouting } = useScouting();
  const [filterSport, setFilterSport] = useState<'all' | 'powerlifting' | 'calisthenics'>('all');

  const filteredShortlist = shortlist.filter((item) =>
    filterSport === 'all' ? true : item.sport === filterSport,
  );

  const handleRemove = async (item: ShortlistItem) => {
    await toggleShortlist(item.athlete_id, item.sport as any);
  };

  const renderShortlistCard = ({ item }: { item: ShortlistItem }) => {
    const athlete = item.athlete || {};
    const ap      = athlete.athlete_profile || {};
    const isBusy  = actionLoadingId === item.athlete_id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(athlete.name || 'A').substring(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.athleteName}>{athlete.name || 'Athlete Candidate'}</Text>
            <Text style={styles.athleteEmail}>{athlete.email}</Text>
            <View style={styles.metaRow}>
              <View style={styles.sportBadge}>
                <Text style={styles.sportBadgeText}>{item.sport.toUpperCase()}</Text>
              </View>
              {ap.location ? <Text style={styles.locationText}>📍 {ap.location}</Text> : null}
            </View>
          </View>
          <Pressable
            style={styles.removeBtn}
            onPress={() => handleRemove(item)}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <Text style={styles.removeBtnText}>Remove 🗑️</Text>
            )}
          </Pressable>
        </View>

        {/* Extended Specs if available */}
        <View style={styles.specsRow}>
          {ap.age ? <Text style={styles.specChip}>Age: {ap.age}</Text> : null}
          {ap.height_cm ? <Text style={styles.specChip}>Height: {ap.height_cm}cm</Text> : null}
          {ap.weight_kg ? <Text style={styles.specChip}>Weight: {ap.weight_kg}kg</Text> : null}
          {ap.experience_level ? <Text style={styles.specChip}>Level: {ap.experience_level}</Text> : null}
        </View>

        {ap.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioText} numberOfLines={2}>"{ap.bio}"</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0A1020']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>

        {/* Top Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>TALENT SHORTLIST ⭐</Text>
          <Text style={styles.subtitle}>Your Bookmarked Athletes ({shortlist.length})</Text>
        </View>

        {/* Sport Filter Chips */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filterSport === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterSport('all')}
          >
            <Text style={[styles.filterText, filterSport === 'all' && styles.activeFilterText]}>All</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filterSport === 'powerlifting' && styles.activeFilterChip]}
            onPress={() => setFilterSport('powerlifting')}
          >
            <Text style={[styles.filterText, filterSport === 'powerlifting' && styles.activeFilterText]}>🏋️ Powerlifting</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filterSport === 'calisthenics' && styles.activeFilterChip]}
            onPress={() => setFilterSport('calisthenics')}
          >
            <Text style={[styles.filterText, filterSport === 'calisthenics' && styles.activeFilterText]}>🤸 Calisthenics</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.warning} />
            <Text style={styles.loadingText}>Loading your shortlisted talent...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredShortlist}
            keyExtractor={(item) => item.id}
            renderItem={renderShortlistCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refreshScouting} tintColor={Colors.warning} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>Shortlist is Empty</Text>
                <Text style={styles.emptySub}>
                  Browse candidate submissions in the Official Scouting Portal to shortlist promising athletes.
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

  header:   { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  backBtn:  { marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  activeFilterChip: { backgroundColor: `${Colors.warning}20`, borderColor: Colors.warning },
  filterText:       { fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  activeFilterText: { color: Colors.warning },

  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 10, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 32 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: `${Colors.warning}20`,
    borderWidth: 1.5, borderColor: Colors.warning, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '900', color: Colors.warning },
  athleteName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  athleteEmail: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  sportBadgeText: { color: Colors.warning, fontSize: 9, fontWeight: '800' },
  locationText:   { color: Colors.textMuted, fontSize: 11 },

  removeBtn:     { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.1)' },
  removeBtnText: { color: Colors.error, fontSize: 11, fontWeight: '700' },

  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  specChip: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    fontSize: 10, color: Colors.textSecondary, borderWidth: 1, borderColor: Colors.border,
  },

  bioBox: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  bioText: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 16 },

  emptyBox: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginVertical: 20,
  },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});
