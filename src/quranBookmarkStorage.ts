import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  QuranBookmark,
} from './quranBookmarks';

const BOOKMARKS_STORAGE_KEY = '@muslim_ummah_quran_bookmarks';

export async function loadBookmarks(): Promise<QuranBookmark[]> {
  try {
    const stored = await AsyncStorage.getItem(
      BOOKMARKS_STORAGE_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is QuranBookmark =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as QuranBookmark).surahNumber === 'number' &&
        typeof (item as QuranBookmark).ayahNumber === 'number'
    );
  } catch (error) {
    console.error(
      'Failed to load Quran bookmarks:',
      error
    );

    return [];
  }
}

export async function saveBookmarks(
  bookmarks: QuranBookmark[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify(bookmarks)
    );
  } catch (error) {
    console.error(
      'Failed to save Quran bookmarks:',
      error
    );
  }
}

export async function clearStoredBookmarks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      BOOKMARKS_STORAGE_KEY
    );
  } catch (error) {
    console.error(
      'Failed to clear Quran bookmarks:',
      error
    );
  }
}
