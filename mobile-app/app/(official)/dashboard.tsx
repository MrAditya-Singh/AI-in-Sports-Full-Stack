/**
 * ATHLETIX — Official Dashboard
 * app/(official)/dashboard.tsx
 */

import React from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useScouting } from '../../hooks/useScouting';
import { useTheme } from '../../hooks/useTheme';

function ActionCard({
  icon,
  title,
  desc,
  accent,
  surfaceColor,
  textColor,
  subColor,
  borderColor,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  accent: string;
  surfaceColor: string;
  textColor: string;
  subColor: string;
  borderColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: surfaceColor,
          borderColor,
          borderLeftColor: accent,
          borderLeftWidth: 4,
        },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>

      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.actionDesc, { color: subColor }]}>{desc}</Text>
      </View>

      <Text style={[styles.actionArrow, { color: accent }]}>
        →
      </Text>
    </Pressable>
  );
}

export default function OfficialDashboard() {
  const router = useRouter();
  const { name, logout } = useAuth();
  const { shortlist, verifications } = useScouting();
  const { colors, isDark } = useTheme();

  const fadeAnim = React.useRef(
    new Animated.Value(0)
  ).current;

  const [isLoggingOut, setIsLoggingOut] =
    React.useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const performLogout = async (): Promise<void> => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/(auth)/login' as never);
    } catch {
      Alert.alert(
        'Logout failed',
        'Unable to log out. Please try again.'
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = (): void => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  const firstName =
    name?.split(' ')[0] ?? 'Official';

  return (
    <LinearGradient
      colors={colors.gradientMain}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Scouting dashboard
              </Text>

              <Text style={[styles.name, { color: colors.textPrimary }]}>
                {firstName} 🏅
              </Text>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: `${colors.primary}50`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    { color: colors.primary },
                  ]}
                >
                  🔵 OFFICIAL
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <ThemeToggle compact />
              <NotificationBell
                routeTarget="/(athlete)/notifications"
              />

              <Pressable
                onPress={handleLogout}
                disabled={isLoggingOut}
                style={[
                  styles.logoutBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'transparent' : colors.surfaceElevated,
                  },
                  isLoggingOut && styles.logoutBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.logoutText,
                    { color: colors.textMuted },
                  ]}
                >
                  {isLoggingOut
                    ? 'Signing out...'
                    : 'Sign out'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Scouting Portal */}
          <Pressable
            onPress={() =>
              router.push('/(official)/review' as never)
            }
            style={({ pressed }) => [
              pressed && { opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(0,212,255,0.22)', 'rgba(0,212,255,0.06)']
                  : ['rgba(2,132,199,0.18)', 'rgba(2,132,199,0.05)']
              }
              style={[styles.banner, { borderColor: `${colors.primary}40` }]}
            >
              <Text style={styles.bannerIcon}>📋</Text>

              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.primary }]}>
                  Open Scouting Portal →
                </Text>

                <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                  Review, verify & shortlist top athletes
                </Text>
              </View>
            </LinearGradient>
          </Pressable>

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            SCOUTING ACTIONS
          </Text>

          <ActionCard
            icon="🔍"
            title="Review Candidate Athletes"
            desc="Browse AI-scored athlete performances by sport & exercise"
            accent={colors.primary}
            surfaceColor={colors.surface}
            textColor={colors.textPrimary}
            subColor={colors.textSecondary}
            borderColor={colors.border}
            onPress={() =>
              router.push('/(official)/review' as never)
            }
          />

          <ActionCard
            icon="📋"
            title="Manage Talent Shortlist"
            desc={`View & manage your ${shortlist.length} bookmarked athlete candidates`}
            accent={colors.warning}
            surfaceColor={colors.surface}
            textColor={colors.textPrimary}
            subColor={colors.textSecondary}
            borderColor={colors.border}
            onPress={() =>
              router.push('/(official)/shortlist' as never)
            }
          />

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            YOUR SCOUTING STATS
          </Text>

          <View style={styles.statsRow}>
            {[
              [
                String(verifications.length),
                'Verified',
                colors.secondary,
              ],
              [
                String(shortlist.length),
                'Shortlisted',
                colors.primary,
              ],
              ['LIVE', 'Portal', colors.warning],
            ].map(([value, label, color]) => (
              <View
                key={label}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: `${color}35`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statValue,
                    { color: color as string },
                  ]}
                >
                  {value}
                </Text>

                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  scroll: {
    padding: 20,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  greeting: {
    fontSize: 13,
  },

  name: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 2,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },

  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },

  logoutBtnDisabled: {
    opacity: 0.6,
  },

  logoutText: {
    fontSize: 11,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },

  bannerIcon: {
    fontSize: 28,
  },

  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },

  bannerSub: {
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 8,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  actionIcon: {
    fontSize: 24,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },

  actionDesc: {
    fontSize: 11,
  },

  actionArrow: {
    fontSize: 18,
    fontWeight: '900',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
