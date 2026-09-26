import {
  loadBookmarks,
  saveBookmarks,
} from './quranBookmarkStorage';

export type QuranBookmark = {
  surahNumber: number;
  ayahNumber: number;
};

let bookmarks: QuranBookmark[] = [];

function getBookmarkKey(
  surahNumber: number,
  ayahNumber: number
): string {
  return `${surahNumber}:${ayahNumber}`;
}

export async function initializeBookmarks(): Promise<void> {
  try {
    bookmarks = await loadBookmarks();
  } catch (error) {
    console.error(
      'Failed to initialize Quran bookmarks:',
      error
    );

    bookmarks = [];
  }
}

export function isBookmarked(
  surahNumber: number,
  ayahNumber: number
): boolean {
  const key = getBookmarkKey(
    surahNumber,
    ayahNumber
  );

  return bookmarks.some(
    (bookmark) =>
      getBookmarkKey(
        bookmark.surahNumber,
        bookmark.ayahNumber
      ) === key
  );
}

export async function addBookmark(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  if (
    isBookmarked(
      surahNumber,
      ayahNumber
    )
  ) {
    return;
  }

  bookmarks.push({
    surahNumber,
    ayahNumber,
  });

  await saveBookmarks(bookmarks);
}

export async function removeBookmark(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  bookmarks = bookmarks.filter(
    (bookmark) =>
      !(
        bookmark.surahNumber === surahNumber &&
        bookmark.ayahNumber === ayahNumber
      )
  );

  await saveBookmarks(bookmarks);
}

export async function toggleBookmark(
  surahNumber: number,
  ayahNumber: number
): Promise<boolean> {
  if (
    isBookmarked(
      surahNumber,
      ayahNumber
    )
  ) {
    await removeBookmark(
      surahNumber,
      ayahNumber
    );

    return false;
  }

  await addBookmark(
    surahNumber,
    ayahNumber
  );

  return true;
}

export function getBookmarks(): QuranBookmark[] {
  return [...bookmarks];
}

export async function clearBookmarks(): Promise<void> {
  bookmarks = [];

  await saveBookmarks(bookmarks);
}
