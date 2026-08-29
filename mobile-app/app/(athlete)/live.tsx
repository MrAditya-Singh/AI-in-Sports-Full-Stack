/**
 * ATHLETIX — Live AI Posture Coach View (Streamlit AI Gym Coach Integration)
 * app/(athlete)/live.tsx
 *
 * Theme-aware (Light Theme Cream #F7F4EE & Dark Theme #0A0E1A) with vector icons.
 * Connects to permanent Railway AI Coach service via EXPO_PUBLIC_AI_COACH_URL or backend launch URL.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
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
import NeomorphicButton from '../../components/NeomorphicButton';
import ThemeToggle from '../../components/ThemeToggle';
import { getLiveLaunchUrl, type LiveLaunchData } from '../../services/liveCoachService';
import { useTheme } from '../../hooks/useTheme';

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
          launch_url: '',
          username: 'athlete',
          service_status: 'unconfigured',
        });
      } finally {
        setIsLoading(false);
      }
    }
    void initLaunch();
  }, []);

  // Compute active AI coach URL from environment variable or backend launch data
  const { activeUrl, isConfigured } = useMemo(() => {
    const envCoachUrl = (process.env.EXPO_PUBLIC_AI_COACH_URL || '').trim().replace(/\/$/, '');
    const user = launchData?.username || 'athlete';
    const rawBackendUrl = (launchData?.launch_url || '').trim();

    // 1. Direct environment variable configured on Vercel / local env
    if (envCoachUrl && !envCoachUrl.includes('trycloudflare.com')) {
      const fullUrl = envCoachUrl.includes('username=')
        ? envCoachUrl
        : `${envCoachUrl}/?username=${encodeURIComponent(user)}`;
      return { activeUrl: fullUrl, isConfigured: true };
    }

    // 2. Valid backend launch URL (not containing legacy expired domains)
    if (
      rawBackendUrl &&
      !rawBackendUrl.includes('trycloudflare.com') &&
      !rawBackendUrl.includes('updating-hey-rough-vote')
    ) {
      const fullUrl = rawBackendUrl.includes('username=')
        ? rawBackendUrl
        : `${rawBackendUrl}/?username=${encodeURIComponent(user)}`;
      return { activeUrl: fullUrl, isConfigured: true };
    }

    // 3. Local development fallback
    if (__DEV__ && Platform.OS === 'web') {
      return {
        activeUrl: `http://localhost:8501/?username=${encodeURIComponent(user)}`,
        isConfigured: true,
      };
    }

    return { activeUrl: '', isConfigured: false };
  }, [launchData]);

  const handleOpenExternal = () => {
    if (!activeUrl) return;
    if (typeof window !== 'undefined') {
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    } else {
      void Linking.openURL(activeUrl);
    }
  };

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
              {isConfigured && (
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
              )}
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
              <View style={[styles.liveDot, { backgroundColor: isConfigured ? (isDark ? '#39FF14' : '#F7F4EE') : '#FFAA00' }]} />
              <Text style={[styles.liveBadgeText, { color: isDark ? colors.secondary : '#F7F4EE' }]}>
                {isConfigured ? 'WEBRTC 60 FPS' : 'SERVICE STANDBY'}
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Single Sign-On: {launchData?.username || 'Authenticated'} · Real-time Pose Landmarks & AI Rep Counter
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {isConfigured ? (
            <>
              {/* Quick Launcher Card for Mobile Browser Camera Access */}
              <MinimalCard variant="darkBlock" contentStyle={{ padding: 18, alignItems: 'center' }}>
                <InnovativeIcon name="video" size={28} color="#F7F4EE" />
                <Text style={[styles.launcherTitle, { color: '#F7F4EE' }]}>
                  LAUNCH LIVE CAMERA SESSION
                </Text>
                <Text style={[styles.launcherSub, { color: 'rgba(247,244,238,0.7)' }]}>
                  Tap below to open full-screen WebRTC camera posture tracking in browser.
                </Text>

                <NeomorphicButton
                  title="OPEN CAMERA IN FULLSCREEN ↗"
                  icon={<InnovativeIcon name="zap" size={16} color="#111111" />}
                  onPress={handleOpenExternal}
                  variant="glass"
                  style={{ marginTop: 14, width: '100%' }}
                />
              </MinimalCard>

              {/* Embedded Viewport */}
              <View style={styles.viewportContainer}>
                {isLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Connecting to AI Gym Coach Engine...
                    </Text>
                  </View>
                ) : Platform.OS === 'web' ? (
                  <iframe
                    src={activeUrl}
                    style={{
                      width: '100%',
                      height: '520px',
                      border: 'none',
                      borderRadius: 20,
                      backgroundColor: isDark ? '#000' : '#FAF8F5',
                    }}
                    title="AI Gym Coach Real-Time Streamer"
                    allow="camera *; microphone *; autoplay *; display-capture *; fullscreen *"
                  />
                ) : (
                  <View style={styles.loadingBox}>
                    <InnovativeIcon name="video" size={36} color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textPrimary, textAlign: 'center', marginTop: 8 }]}>
                      Live AI WebRTC Streaming Active
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'center', maxWidth: 280 }]}>
                      Click full screen launch button above to access camera feed and AI coach on your mobile device.
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <MinimalCard variant="elevated" contentStyle={{ padding: 22, alignItems: 'center' }}>
              <InnovativeIcon name="cpu" size={36} color={colors.warning || '#FFAA00'} />
              <Text style={[styles.launcherTitle, { color: colors.textPrimary, textAlign: 'center', marginTop: 12 }]}>
                AI Coach Service Configuring
              </Text>
              <Text style={[styles.launcherSub, { color: colors.textMuted, textAlign: 'center', marginVertical: 8 }]}>
                The permanent Railway AI Coach URL is being connected. Set{' '}
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>EXPO_PUBLIC_AI_COACH_URL</Text>{' '}
                on Vercel to your deployed Railway service URL.
              </Text>
              <NeomorphicButton
                title="RELOAD STATUS"
                icon={<InnovativeIcon name="refresh-cw" size={16} color={isDark ? '#FFFFFF' : '#111111'} />}
                onPress={async () => {
                  setIsLoading(true);
                  try {
                    const data = await getLiveLaunchUrl();
                    setLaunchData(data);
                  } catch {
                    // ignore
                  } finally {
                    setIsLoading(false);
                  }
                }}
                variant="default"
                style={{ marginTop: 14, width: '100%' }}
              />
            </MinimalCard>
          )}
        </ScrollView>
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
  launcherTitle: { fontSize: 15, fontWeight: '900', marginTop: 8, letterSpacing: 0.5 },
  launcherSub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  viewportContainer: {
    height: 520,
    marginTop: 14,
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
