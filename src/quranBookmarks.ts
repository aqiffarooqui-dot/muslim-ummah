export type QuranBookmark = {
  surahNumber: number;
  ayahNumber: number;
};

const bookmarks = new Set<string>();

function getBookmarkKey(
  surahNumber: number,
  ayahNumber: number
): string {
  return `${surahNumber}:${ayahNumber}`;
}

export function isBookmarked(
  surahNumber: number,
  ayahNumber: number
): boolean {
  return bookmarks.has(
    getBookmarkKey(surahNumber, ayahNumber)
  );
}

export function addBookmark(
  surahNumber: number,
  ayahNumber: number
): void {
  bookmarks.add(
    getBookmarkKey(surahNumber, ayahNumber)
  );
}

export function removeBookmark(
  surahNumber: number,
  ayahNumber: number
): void {
  bookmarks.delete(
    getBookmarkKey(surahNumber, ayahNumber)
  );
}

export function toggleBookmark(
  surahNumber: number,
  ayahNumber: number
): boolean {
  const key = getBookmarkKey(
    surahNumber,
    ayahNumber
  );

  if (bookmarks.has(key)) {
    bookmarks.delete(key);
    return false;
  }

  bookmarks.add(key);
  return true;
}

export function getBookmarks(): QuranBookmark[] {
  return Array.from(bookmarks).map((key) => {
    const [surahNumber, ayahNumber] = key
      .split(':')
      .map(Number);

    return {
      surahNumber,
      ayahNumber,
    };
  });
}

export function clearBookmarks(): void {
  bookmarks.clear();
}
