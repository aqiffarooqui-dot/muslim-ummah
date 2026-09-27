import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThemeId } from './themeTypes';

const THEME_KEY =
  '@muslim_ummah_selected_theme';

export async function saveSelectedTheme(
  themeId: AppThemeId
): Promise<void> {
  await AsyncStorage.setItem(
    THEME_KEY,
    themeId
  );
}

export async function getSelectedTheme(): Promise<AppThemeId> {
  const saved =
    await AsyncStorage.getItem(
      THEME_KEY
    );

  const validThemes: AppThemeId[] = [
    'midnight',
    'amoled',
    'emerald',
    'royal',
    'sandstone',
    'sapphire',
  ];

  if (
    saved &&
    validThemes.includes(
      saved as AppThemeId
    )
  ) {
    return saved as AppThemeId;
  }

  return 'midnight';
}
