/**
 * ATHLETIX — Live AI Posture Coach View (AI Gym Coach Integration)
 * app/(athlete)/live.tsx
 *
 * Smoothly embeds `ai-gym-coach-main - Copy` with single-sign-on (SSO).
 *  - Auto-logins current user (No duplicate login wall!)
 *  - WebRTC live camera pose landmarker tracking
 *  - Real-time rep counter & Groq AI voice coaching
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { getLiveLaunchUrl, type LiveLaunchData } from '../../services/liveCoachService';
import { Colors } from '../../constants/colors';

export default function LiveCoachScreen() {
  const router = useRouter();
  const [launchData, setLaunchData] = useState<LiveLaunchData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function initLaunch() {
      try {
        const data = await getLiveLaunchUrl();
        const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
        const formattedUrl = `http://${host}:8501/?username=${encodeURIComponent(data.username)}`;
        setLaunchData({
          ...data,
          launch_url: formattedUrl,
        });
      } catch (err: unknown) {
        const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
        setLaunchData({
          launch_url: `http://${host}:8501/?username=athlete`,
          username: 'athlete',
          service_status: 'fallback',
        });
      } finally {
        setIsLoading(false);
      }
    }
    void initLaunch();
  }, []);

  return (
    <LinearGradient
      colors={['#070B14', '#0A0E1A', '#0D1424']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace('/(athlete)/upload' as never)}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back to Upload Options</Text>
          </Pressable>
          <View style={styles.titleRow}>
            <Text style={styles.title}>AI REAL-TIME POSTURE COACH ⚡</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE CAMERA WEBRTC</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Integrated from AI Gym Coach · Single Sign-On ({launchData?.username || 'Authenticated'})
          </Text>
        </View>

        {/* ── Viewport / Stream Container ── */}
        <View style={styles.viewportContainer}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                Connecting to AI Gym Coach Real-time Engine...
              </Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : (
            <iframe
              src={launchData?.launch_url || 'http://localhost:8501'}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 20,
                backgroundColor: '#000',
              }}
              title="AI Gym Coach Real-Time Streamer"
              allow="camera; microphone; autoplay"
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(57,255,20,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
  },
  liveBadgeText: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

  viewportContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: '#000',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700' },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { color: Colors.error, fontSize: 13, fontWeight: '700' },
});
