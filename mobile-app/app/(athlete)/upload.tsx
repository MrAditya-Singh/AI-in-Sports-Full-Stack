/**
 * ATHLETIX — Video Upload & AI Assessment Portal (Phase 3: FULLY IMPLEMENTED)
 * app/(athlete)/upload.tsx
 *
 * Professional CUJU-style video assessment submission:
 *  - Sport & Exercise Selector cards with glowing neon accents
 *  - Camera & Video Guidelines (Angle, distance, lighting)
 *  - File selection via expo-document-picker
 *  - Live animated upload progress bar & status tracker
 *  - Recent submissions list with real-time AI processing badges
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { useVideos } from '../../hooks/useVideos';
import { SPORTS, Sport, Exercise, findExercise } from '../../constants/sports';
import { Colors } from '../../constants/colors';
import { VideoRecord } from '../../services/videoService';

export default function UploadVideoScreen() {
  const router = useRouter();
  const { videos, isUploading, uploadProgress, submitVideo, refreshVideos } = useVideos();

  const [selectedSport, setSelectedSport] = useState<Sport>('powerlifting');
  const [selectedExercise, setSelectedExercise] = useState<Exercise>('squat');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; size?: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const currentSport = SPORTS.find((s) => s.key === selectedSport);
  const currentExerciseInfo = findExercise(selectedExercise);

  const showToast = (msg: string) => {
    setToast(msg);
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
        showToast(`Video selected: ${asset.name || 'attempt.mp4'} 🎬`);
      }
    } catch (err: any) {
      showToast('Could not open file picker.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a video file first!');
      return;
    }

    try {
      const res = await submitVideo({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: 'video/mp4',
        sport: selectedSport,
        exercise: selectedExercise,
      });

      setSelectedFile(null);
      showToast('Video uploaded! AI BlazePose analysis in progress... 🤖');
    } catch (err: any) {
      showToast(err.message || 'Upload failed.');
    }
  };

  const renderVideoStatusBadge = (status: VideoRecord['status']) => {
    const configs = {
      pending:    { label: 'Pending ⏳', color: Colors.warning, bg: `${Colors.warning}15` },
      processing: { label: 'Analyzing 🤖', color: Colors.primary, bg: `${Colors.primary}15` },
      completed:  { label: 'Report Ready 🎯', color: Colors.secondary, bg: `${Colors.secondary}15` },
      failed:     { label: 'Failed ❌', color: Colors.error, bg: `${Colors.error}15` },
    };
    const c = configs[status] || configs.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: c.bg, borderColor: `${c.color}40` }]}>
        <Text style={[styles.statusBadgeText, { color: c.color }]}>{c.label}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#070B14', '#0A0E1A', '#0D1424']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* ── Top Header ── */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>AI ASSESSMENT UPLOAD 🎬</Text>
            <Text style={styles.subtitle}>MediaPipe BlazePose 33-Keypoint Form & Rep Analysis</Text>
          </View>

          {toast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          )}

          {/* ── Step 1: Select Sport ── */}
          <Text style={styles.sectionTitle}>1. SELECT SPORT DISCIPLINE</Text>
          <View style={styles.sportSelectorRow}>
            {SPORTS.map((sport) => {
              const isSelected = selectedSport === sport.key;
              return (
                <Pressable
                  key={sport.key}
                  style={[styles.sportCard, isSelected && styles.sportCardActive]}
                  onPress={() => {
                    setSelectedSport(sport.key);
                    setSelectedExercise(sport.exercises[0].key);
                  }}
                >
                  <Text style={styles.sportIcon}>{sport.icon}</Text>
                  <Text style={[styles.sportLabel, isSelected && styles.sportLabelActive]}>
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Step 2: Select Exercise ── */}
          <Text style={styles.sectionTitle}>2. SELECT EXERCISE ATTEMPT</Text>
          <View style={styles.exercisePillsRow}>
            {currentSport?.exercises.map((ex) => {
              const isSelected = selectedExercise === ex.key;
              return (
                <Pressable
                  key={ex.key}
                  style={[styles.exercisePill, isSelected && styles.exercisePillActive]}
                  onPress={() => setSelectedExercise(ex.key)}
                >
                  <Text style={[styles.exercisePillText, isSelected && styles.exercisePillTextActive]}>
                    {ex.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Exercise Guidelines Card ── */}
          {currentExerciseInfo && (
            <View style={styles.guidelineCard}>
              <View style={styles.guidelineHeader}>
                <Text style={styles.guidelineIcon}>💡</Text>
                <Text style={styles.guidelineTitle}>AI Standards: {currentExerciseInfo.label}</Text>
              </View>
              <Text style={styles.guidelineDesc}>{currentExerciseInfo.description}</Text>
              <View style={styles.tipsRow}>
                <Text style={styles.tipText}>📐 Camera: Full body in frame (Side/Diagonal)</Text>
                <Text style={styles.tipText}>💡 Lighting: Clear contrast, avoid backlight</Text>
              </View>
            </View>
          )}

          {/* ── Step 3: Pick & Upload Video ── */}
          <Text style={styles.sectionTitle}>3. SELECT ATTEMPT VIDEO</Text>

          <Pressable
            style={({ pressed }) => [styles.dropzone, pressed && { opacity: 0.8 }]}
            onPress={handlePickVideo}
            disabled={isUploading}
          >
            <LinearGradient
              colors={selectedFile ? ['rgba(57,255,20,0.08)', 'rgba(0,212,255,0.08)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
              style={styles.dropzoneGrad}
            >
              <Text style={styles.dropzoneIcon}>{selectedFile ? '✅' : '📹'}</Text>
              <Text style={styles.dropzoneTitle}>
                {selectedFile ? selectedFile.name : 'Tap to Pick Attempt Video'}
              </Text>
              <Text style={styles.dropzoneSub}>
                {selectedFile
                  ? `${selectedFile.size ? (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB · ' : ''}Ready for AI analysis`
                  : 'MP4, MOV, AVI up to 150MB (max 60 sec)'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* ── Upload & Analyze Button ── */}
          {isUploading ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStatusText}>Uploading & Launching BlazePose Pipeline...</Text>
                <Text style={styles.progressPercentText}>{uploadProgress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.uploadBtn,
                !selectedFile && styles.uploadBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleUpload}
              disabled={!selectedFile}
            >
              <LinearGradient
                colors={selectedFile ? ['#00D4FF', '#0099FF'] : ['#333', '#222']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.uploadBtnGrad}
              >
                <Text style={[styles.uploadBtnText, !selectedFile && { color: '#888' }]}>
                  🚀  Submit for AI Performance Assessment
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* ── Recent Submissions ── */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>RECENT SUBMISSIONS & STATUS</Text>
          {videos.length === 0 ? (
            <View style={styles.emptyVideos}>
              <Text style={styles.emptyVideosIcon}>📼</Text>
              <Text style={styles.emptyVideosTitle}>No submissions yet</Text>
              <Text style={styles.emptyVideosSub}>
                Your uploaded videos and AI assessment status will appear here.
              </Text>
            </View>
          ) : (
            videos.slice(0, 5).map((v) => (
              <View key={v.id} style={styles.videoCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoExercise}>
                    {v.exercise.toUpperCase().replace('_', ' ')} · {v.sport.toUpperCase()}
                  </Text>
                  <Text style={styles.videoDate}>
                    Uploaded {new Date(v.uploaded_at).toLocaleDateString()} at{' '}
                    {new Date(v.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {renderVideoStatusBadge(v.status)}
                  {v.status === 'completed' && (
                    <Pressable
                      onPress={() => router.push('/(athlete)/reports' as any)}
                      style={styles.viewReportBtn}
                    >
                      <Text style={styles.viewReportBtnText}>View Report →</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  scroll:   { padding: 20, paddingBottom: 48 },

  header:   { marginBottom: 20 },
  backBtn:  { marginBottom: 8 },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  title:    { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  toast: {
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.primary,
    padding: 12, marginBottom: 16, alignItems: 'center',
  },
  toastText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },

  sectionTitle: { fontSize: 10, letterSpacing: 2, color: Colors.textMuted, fontWeight: '800', marginBottom: 12, marginTop: 12 },

  sportSelectorRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  sportCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  sportCardActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}12` },
  sportIcon:       { fontSize: 28, marginBottom: 6 },
  sportLabel:      { fontSize: 13, fontWeight: '800', color: Colors.textSecondary },
  sportLabelActive:{ color: Colors.textPrimary },

  exercisePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  exercisePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  exercisePillActive: { backgroundColor: `${Colors.secondary}20`, borderColor: Colors.secondary },
  exercisePillText:   { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  exercisePillTextActive: { color: Colors.secondary },

  guidelineCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  guidelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  guidelineIcon:   { fontSize: 18 },
  guidelineTitle:  { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  guidelineDesc:   { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 8 },
  tipsRow:         { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, gap: 4 },
  tipText:         { fontSize: 11, color: Colors.textMuted },

  dropzone:     { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: `${Colors.primary}40`, borderStyle: 'dashed', marginBottom: 20 },
  dropzoneGrad: { padding: 28, alignItems: 'center' },
  dropzoneIcon: { fontSize: 36, marginBottom: 8 },
  dropzoneTitle:{ fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  dropzoneSub:  { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  progressContainer:  { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  progressHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStatusText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  progressPercentText:{ fontSize: 12, color: Colors.primary, fontWeight: '900' },
  progressTrack:      { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill:       { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  uploadBtn:         { borderRadius: 16, overflow: 'hidden' },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnGrad:     { paddingVertical: 18, alignItems: 'center' },
  uploadBtnText:     { fontSize: 15, fontWeight: '900', color: '#000' },

  emptyVideos: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyVideosIcon:  { fontSize: 32, marginBottom: 8 },
  emptyVideosTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  emptyVideosSub:   { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  videoCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  videoExercise: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 3 },
  videoDate:     { fontSize: 11, color: Colors.textMuted },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  viewReportBtn:     { marginTop: 4 },
  viewReportBtnText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
});
