import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuranReadingMode = 'comfortable' | 'compact';

export type QuranReadingSettings = {
  fontSize: number;
  lineSpacing: number;
  mode: QuranReadingMode;
};

export const DEFAULT_QURAN_READING_SETTINGS: QuranReadingSettings = {
  fontSize: 25,
  lineSpacing: 48,
  mode: 'comfortable',
};

const STORAGE_KEY = 'muslim_ummah_quran_reading_settings_v1';

export async function getQuranReadingSettings(): Promise<QuranReadingSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_QURAN_READING_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<QuranReadingSettings>;

    return {
      fontSize:
        typeof parsed.fontSize === 'number'
          ? Math.min(36, Math.max(20, parsed.fontSize))
          : DEFAULT_QURAN_READING_SETTINGS.fontSize,
      lineSpacing:
        typeof parsed.lineSpacing === 'number'
          ? Math.min(70, Math.max(34, parsed.lineSpacing))
          : DEFAULT_QURAN_READING_SETTINGS.lineSpacing,
      mode:
        parsed.mode === 'compact' ? 'compact' : 'comfortable',
    };
  } catch {
    return DEFAULT_QURAN_READING_SETTINGS;
  }
}

export async function saveQuranReadingSettings(
  settings: QuranReadingSettings
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings)
  );
}
