/**
 * ATHLETIX — useTheme Hook
 * hooks/useTheme.ts
 *
 * Exposes active theme state, full color tokens, and instant toggle actions.
 */

import { useEffect } from 'react';
import { useThemeStore } from '../stores/useThemeStore';

export function useTheme() {
  const {
    mode,
    isDark,
    colors,
    isInitialized,
    setThemeMode,
    toggleTheme,
    initialize,
  } = useThemeStore();

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initialize]);

  return {
    mode,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
  };
}
