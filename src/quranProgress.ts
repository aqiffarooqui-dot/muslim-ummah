import AsyncStorage from '@react-native-async-storage/async-storage';

const QURAN_PROGRESS_KEY = '@muslim_ummah_quran_progress';

export type QuranReadingProgress = {
  surahNumber: number;
  ayahNumber: number;
};

export async function saveQuranProgress(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  const progress: QuranReadingProgress = {
    surahNumber,
    ayahNumber,
  };

  await AsyncStorage.setItem(
    QURAN_PROGRESS_KEY,
    JSON.stringify(progress)
  );
}

export async function getQuranProgress(): Promise<QuranReadingProgress | null> {
  const storedProgress = await AsyncStorage.getItem(QURAN_PROGRESS_KEY);

  if (!storedProgress) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedProgress);

    if (
      typeof parsed?.surahNumber !== 'number' ||
      typeof parsed?.ayahNumber !== 'number'
    ) {
      return null;
    }

    return {
      surahNumber: parsed.surahNumber,
      ayahNumber: parsed.ayahNumber,
    };
  } catch {
    return null;
  }
}

export async function clearQuranProgress(): Promise<void> {
  await AsyncStorage.removeItem(QURAN_PROGRESS_KEY);
}
