// Theme context + provider.
// - Reads the active mode ('dark' | 'light') from AsyncStorage.
// - Falls back to the system color scheme, defaulting to 'dark' so the HF
//   look-and-feel is the first impression.
// - Exposes a toggle so a header/profile button can flip modes.

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PALETTES, Palette, ThemeMode } from './theme';

const STORAGE_KEY = 'agroflow.themeMode';

interface ThemeContextValue {
  mode: ThemeMode;
  palette: Palette;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemDefault(): ThemeMode {
  const scheme = Appearance.getColorScheme();
  return scheme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(systemDefault());
  const [isReady, setIsReady] = useState(false);

  // Hydrate from storage on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && (stored === 'dark' || stored === 'light')) {
          setModeState(stored);
        }
      } catch {
        // ignore – fall back to system default
      } finally {
        if (active) setIsReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* best-effort */
    });
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
        /* best-effort */
      });
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      palette: PALETTES[mode],
      setMode,
      toggleMode,
      isReady,
    }),
    [mode, setMode, toggleMode, isReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return ctx;
}

export function usePalette(): Palette {
  return useTheme().palette;
}
