/**
 * ATHLETIX — Theme Zustand Store
 * stores/useThemeStore.ts
 *
 * Persists theme preference (dark/light/system) using AsyncStorage and
 * provides immediate reactive access to active colors throughout the app.
 */

import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type ThemeColors,
  type ThemeMode,
  DarkColors,
  LightColors,
  getThemeColors,
} from '../constants/colors';

const THEME_STORAGE_KEY = '@athletix_theme_mode';

export interface ThemeStoreState {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  isInitialized: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  initialize: () => Promise<void>;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') {
    const sys = Appearance.getColorScheme();
    return sys !== 'light'; // Default to dark if undefined or dark
  }
  return mode === 'dark';
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  mode: 'dark',
  isDark: true,
  colors: DarkColors as unknown as ThemeColors,
  isInitialized: false,

  setThemeMode: async (mode: ThemeMode) => {
    const isDark = resolveIsDark(mode);
    const colors = getThemeColors(isDark);
    set({ mode, isDark, colors });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore storage write errors
    }
  },

  toggleTheme: async () => {
    const currentIsDark = get().isDark;
    const newMode: ThemeMode = currentIsDark ? 'light' : 'dark';
    await get().setThemeMode(newMode);
  },

  initialize: async () => {
    if (get().isInitialized) return;

    let savedMode: ThemeMode = 'dark';
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        savedMode = stored;
      }
    } catch {
      // Fallback to default dark
    }

    const isDark = resolveIsDark(savedMode);
    const colors = getThemeColors(isDark);
    set({
      mode: savedMode,
      isDark,
      colors,
      isInitialized: true,
    });

    // Listen to system theme changes if set to system
    Appearance.addChangeListener(() => {
      if (get().mode === 'system') {
        const sysIsDark = resolveIsDark('system');
        set({
          isDark: sysIsDark,
          colors: getThemeColors(sysIsDark),
        });
      }
    });
  },
}));
