import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getSavedTheme,
  saveTheme,
} from './themeService';

import {
  usePremium,
} from '../premium/PremiumProvider';

export type AppThemeId =
  | 'midnight'
  | 'amoled'
  | 'emerald'
  | 'royal'
  | 'sandstone';

export type AppTheme = {
  id: AppThemeId;
  name: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
};

export const APP_THEMES: AppTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#080A0F',
    surface: '#11141B',
    card: '#151922',
    border: '#292E39',
    text: '#FFFFFF',
    muted: '#777D89',
    accent: '#D8B36A',
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    background: '#000000',
    surface: '#080808',
    card: '#101010',
    border: '#242424',
    text: '#FFFFFF',
    muted: '#777777',
    accent: '#E2C27A',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    background: '#06100C',
    surface: '#0B1913',
    card: '#10231A',
    border: '#234536',
    text: '#F3FFF8',
    muted: '#81978B',
    accent: '#B8D99A',
  },
  {
    id: 'royal',
    name: 'Royal',
    background: '#0B0813',
    surface: '#151020',
    card: '#1B1528',
    border: '#382C4D',
    text: '#FFFFFF',
    muted: '#91869F',
    accent: '#D6B5F5',
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    background: '#12100C',
    surface: '#1B1711',
    card: '#241E15',
    border: '#443827',
    text: '#FFF9EC',
    muted: '#A69A83',
    accent: '#E3C17B',
  },
];

type ThemeContextValue = {
  theme: AppTheme;
  themeId: AppThemeId;
  themes: AppTheme[];
  setTheme: (
    themeId: AppThemeId
  ) => Promise<void>;
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
  const {
    isPremium,
  } = usePremium();

  const [themeId, setThemeId] =
    useState<AppThemeId>('midnight');

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const saved =
          await getSavedTheme();

        const valid = APP_THEMES.some(
          (theme) =>
            theme.id === saved
        );

        if (valid) {
          setThemeId(
            saved as AppThemeId
          );
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function setTheme(
    nextTheme: AppThemeId
  ) {
    if (
      nextTheme !== 'midnight' &&
      !isPremium
    ) {
      return;
    }

    setThemeId(nextTheme);

    await saveTheme(nextTheme);
  }

  const theme =
    APP_THEMES.find(
      (item) =>
        item.id === themeId
    ) ??
    APP_THEMES[0];

  const value = useMemo(
    () => ({
      theme,
      themeId,
      themes: APP_THEMES,
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
