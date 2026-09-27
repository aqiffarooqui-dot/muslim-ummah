import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getSelectedTheme,
  saveSelectedTheme,
} from './themeService';

import {
  getThemeById,
  THEME_PRESETS,
} from './themePresets';

import type {
  AppTheme,
  AppThemeId,
} from './themeTypes';

import { usePremium } from '../premium/PremiumProvider';

type ThemeContextValue = {
  theme: AppTheme;
  themeId: AppThemeId;
  themes: AppTheme[];
  setTheme: (
    themeId: AppThemeId
  ) => Promise<boolean>;
  loading: boolean;
};

const ThemeContext =
  createContext<
    ThemeContextValue | undefined
  >(undefined);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPremium } =
    usePremium();

  const [
    themeId,
    setThemeId,
  ] =
    useState<AppThemeId>(
      'midnight'
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved =
          await getSelectedTheme();

        if (saved !== 'midnight' && !isPremium) {
          setThemeId('midnight');
        } else {
          setThemeId(saved);
        }
      } catch (error) {
        console.error(
          'Theme loading error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, [isPremium]);

  async function setTheme(
    nextTheme: AppThemeId
  ): Promise<boolean> {
    if (
      nextTheme !== 'midnight' &&
      !isPremium
    ) {
      return false;
    }

    setThemeId(nextTheme);

    await saveSelectedTheme(
      nextTheme
    );

    return true;
  }

  const theme =
    getThemeById(themeId);

  const value =
    useMemo(
      () => ({
        theme,
        themeId,
        themes: THEME_PRESETS,
        setTheme,
        loading,
      }),
      [
        theme,
        themeId,
        loading,
        isPremium,
      ]
    );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
}
