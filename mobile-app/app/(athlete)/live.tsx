/**
 * ATHLETIX — Live AI Posture Coach View (Streamlit AI Gym Coach Integration)
 * app/(athlete)/live.tsx
 *
 * Theme-aware (Light Theme Cream #F7F4EE & Dark Theme #0A0E1A) with vector icons.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
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
import { getLiveLaunchUrl, type LiveLaunchData } from '../../services/liveCoachService';
import { useTheme } from '../../hooks/useTheme';

const FALLBACK_LIVE_URL = 'https://recall-emacs-reported-mlb.trycloudflare.com';

export default function LiveCoachScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [launchData, setLaunchData] = useState<LiveLaunchData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initLaunch() {
      try {
        const data = await getLiveLaunchUrl();
        setLaunchData(data);
      } catch (err: unknown) {
        setLaunchData({
          launch_url: `${FALLBACK_LIVE_URL}/?username=athlete`,
          username: 'athlete',
          service_status: 'fallback',
        });
      } finally {
        setIsLoading(false);
      }
    }
    void initLaunch();
  }, []);

  const handleOpenExternal = () => {
    const url = launchData?.launch_url || FALLBACK_LIVE_URL;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      void Linking.openURL(url);
    }
  };

  const activeUrl = launchData?.launch_url || `${FALLBACK_LIVE_URL}/?username=athlete`;

  return (
    <LinearGradient colors={colors.gradientMain} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.topNavRow}>
            <Pressable
              onPress={() => router.replace('/(athlete)/dashboard' as never)}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <InnovativeIcon name="arrow-left" size={16} color={colors.textPrimary} />
              <Text style={[styles.backText, { color: colors.textPrimary }]}>Dashboard</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemeToggle compact />
              <Pressable
                onPress={handleOpenExternal}
                style={[
                  styles.openExternalBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#111111',
                    borderColor: colors.border,
                  },
                ]}
              >
                <InnovativeIcon name="arrow-up-right" size={14} color={isDark ? colors.textPrimary : '#F7F4EE'} />
                <Text style={[styles.openExternalText, { color: isDark ? colors.textPrimary : '#F7F4EE' }]}>
                  Fullscreen
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Live AI Posture Coach
            </Text>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: isDark ? 'rgba(57, 255, 20, 0.12)' : '#111111',
                  borderColor: isDark ? 'rgba(57, 255, 20, 0.3)' : '#111111',
                },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: isDark ? '#39FF14' : '#F7F4EE' }]} />
              <Text style={[styles.liveBadgeText, { color: isDark ? colors.secondary : '#F7F4EE' }]}>
                WEBRTC 60 FPS
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Single Sign-On: {launchData?.username || 'Authenticated'} · Real-time Pose Landmarks & AI Rep Counter
          </Text>
        </View>

        {/* Viewport */}
        <View style={styles.viewportContainer}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Connecting to AI Gym Coach Engine...
              </Text>
            </View>
          ) : (
            <iframe
              src={activeUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 20,
                backgroundColor: isDark ? '#000' : '#FAF8F5',
              }}
              title="AI Gym Coach Real-Time Streamer"
              allow="camera *; microphone *; autoplay *; display-capture *; fullscreen *"
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
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  backText: { fontSize: 12, fontWeight: '700' },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  openExternalText: { fontSize: 12, fontWeight: '800' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { fontSize: 11, fontWeight: '500', marginTop: 4 },
  viewportContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 12, fontWeight: '600' },
});
