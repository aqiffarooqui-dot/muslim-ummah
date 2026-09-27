import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SURAHS } from './QuranData';
import { QuranBookmark, initializeBookmarks, getBookmarks, removeBookmark } from './quranBookmarks';
import QuranArabicText from './QuranArabicText';

type BookmarkItem = QuranBookmark & {
  surahName: string;
  arabicSurahName: string;
  ayahText: string;
};

type QuranBookmarksScreenProps = {
  onBack: () => void;
  onOpenAyah: (surahNumber: number, ayahNumber: number) => void;
};

const QURAN_TEXT_URL = '/quran-uthmani.txt';

export default function QuranBookmarksScreen({
  onBack,
  onOpenAyah,
}: QuranBookmarksScreenProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedBookmarks();
  }, []);

  async function loadSavedBookmarks() {
    try {
      setLoading(true);

      await initializeBookmarks();

      const saved = getBookmarks();

      if (saved.length === 0) {
        setBookmarks([]);
        return;
      }

      const response = await fetch(QURAN_TEXT_URL, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          `Quran file returned ${response.status}`
        );
      }

      const text = await response.text();

      const lines = text
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const ayahMap = new Map<string, string>();

      for (const line of lines) {
        const parts = line.split('|');

        if (parts.length < 3) {
          continue;
        }

        const surahNumber = Number(parts[0]);
        const ayahNumber = Number(parts[1]);
        const ayahText = parts.slice(2).join('|').trim();

        if (
          !Number.isInteger(surahNumber) ||
          !Number.isInteger(ayahNumber) ||
          !ayahText
        ) {
          continue;
        }

        ayahMap.set(
          `${surahNumber}:${ayahNumber}`,
          ayahText
        );
      }

      const items: BookmarkItem[] = saved
        .map((bookmark) => {
          const surah = SURAHS.find(
            (item) =>
              item.number === bookmark.surahNumber
          );

          const ayahText = ayahMap.get(
            `${bookmark.surahNumber}:${bookmark.ayahNumber}`
          );

          if (!surah || !ayahText) {
            return null;
          }

          return {
            ...bookmark,
            surahName: surah.name,
            arabicSurahName: surah.arabicName,
            ayahText,
          };
        })
        .filter(
          (item): item is BookmarkItem =>
            item !== null
        );

      setBookmarks(items);
    } catch (error) {
      console.error(
        'Failed to load saved Quran bookmarks:',
        error
      );

      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(
    surahNumber: number,
    ayahNumber: number
  ) {
    try {
      await removeBookmark(
        surahNumber,
        ayahNumber
      );

      setBookmarks((previous) =>
        previous.filter(
          (bookmark) =>
            !(
              bookmark.surahNumber ===
                surahNumber &&
              bookmark.ayahNumber ===
                ayahNumber
            )
        )
      );
    } catch (error) {
      console.error(
        'Failed to remove Quran bookmark:',
        error
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading saved Ayahs...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              YOUR QURAN
            </Text>

            <Text style={styles.title}>
              Saved Ayahs
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="bookmark"
              size={21}
              color="#D9C77A"
            />
          </View>
        </View>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bookmark-outline"
                size={32}
                color="#D9C77A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No saved Ayahs yet
            </Text>

            <Text style={styles.emptyText}>
              Tap the bookmark icon on any Quran
              Ayah to save it here for later.
            </Text>

            <Pressable
              style={styles.browseButton}
              onPress={onBack}
            >
              <Text style={styles.browseButtonText}>
                Browse Quran
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="#101512"
              />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="bookmark"
                  size={19}
                  color="#D9C77A"
                />
              </View>

              <View>
                <Text style={styles.summaryTitle}>
                  {bookmarks.length}{' '}
                  {bookmarks.length === 1
                    ? 'Saved Ayah'
                    : 'Saved Ayahs'}
                </Text>

                <Text style={styles.summaryText}>
                  Your personal Quran collection
                </Text>
              </View>
            </View>

            <View style={styles.list}>
              {bookmarks.map((bookmark) => (
                <View
                  key={`${bookmark.surahNumber}:${bookmark.ayahNumber}`}
                  style={styles.bookmarkCard}
                >
                  <View style={styles.cardHeader}>
                    <Pressable
                      style={styles.surahInfo}
                      onPress={() =>
                        onOpenAyah(
                          bookmark.surahNumber,
                          bookmark.ayahNumber
                        )
                      }
                    >
                      <Text style={styles.surahName}>
                        {bookmark.surahName}
                      </Text>

                      <Text
                        style={
                          styles.arabicSurahName
                        }
                      >
                        {bookmark.arabicSurahName}
                      </Text>

                      <Text style={styles.ayahLabel}>
                        Ayah {bookmark.ayahNumber}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.removeButton}
                      hitSlop={8}
                      onPress={() =>
                        handleRemove(
                          bookmark.surahNumber,
                          bookmark.ayahNumber
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Remove bookmark from ${bookmark.surahName} Ayah ${bookmark.ayahNumber}`}
                    >
                      <Ionicons
                        name="bookmark"
                        size={21}
                        color="#D9C77A"
                      />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() =>
                      onOpenAyah(
                        bookmark.surahNumber,
                        bookmark.ayahNumber
                      )
                    }
                  >
                    <QuranArabicText
                      style={styles.ayahText}
                    >
                      {bookmark.ayahText}
                    </QuranArabicText>
                  </Pressable>

                  <Pressable
                    style={styles.openButton}
                    onPress={() =>
                      onOpenAyah(
                        bookmark.surahNumber,
                        bookmark.ayahNumber
                      )
                    }
                  >
                    <Text style={styles.openButtonText}>
                      Open in Quran
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#D9C77A"
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0F',
    padding: 24,
  },

  loadingText: {
    color: '#A3A8B5',
    fontSize: 14,
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: '#252A36',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  eyebrow: {
    color: '#D9C77A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 3,
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#171A20',
    borderWidth: 1,
    borderColor: '#2A2D35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11161A',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#26322E',
    padding: 16,
    marginBottom: 14,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1C2B24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryTitle: {
    color: '#F0F0E7',
    fontSize: 15,
    fontWeight: '700',
  },

  summaryText: {
    color: '#737E77',
    fontSize: 10,
    marginTop: 3,
  },

  list: {
    gap: 12,
  },

  bookmarkCard: {
    backgroundColor: '#11141B',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#252A35',
    padding: 17,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  surahInfo: {
    flex: 1,
  },

  surahName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  arabicSurahName: {
    color: '#D9CDBA',
    fontSize: 16,
    marginTop: 2,
  },

  ayahLabel: {
    color: '#D9C77A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
  },

  removeButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#1A1D22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahText: {
    color: '#F2EBDD',
    fontSize: 24,
    lineHeight: 46,
    marginTop: 16,
  },

  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 15,
    paddingVertical: 7,
  },

  openButtonText: {
    color: '#D9C77A',
    fontSize: 11,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#11141B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#252A35',
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#1B2028',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: '#858B99',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },

  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D9C77A',
    borderRadius: 17,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 20,
  },

  browseButtonText: {
    color: '#101512',
    fontSize: 12,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 40,
  },
});
