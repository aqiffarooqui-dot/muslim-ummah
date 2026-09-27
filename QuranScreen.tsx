import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SURAHS } from './src/QuranData';
import {
  parseQuranText,
  QuranSurah,
} from './src/quranParser';
import {
  QuranLanguage,
  getTranslation,
  TranslationMap,
} from './src/quranTranslation';
import {
  DEFAULT_QURAN_LANGUAGE,
  QURAN_LANGUAGES,
  TRANSLATION_FILE_URLS,
} from './src/quranTranslations';
import { parseTranslationText } from './src/quranTranslationParser';

import QuranLanguageSelector from './src/QuranLanguageSelector';
import QuranAyahCard from './src/QuranAyahCard';

import {
  getBookmarks,
  initializeBookmarks,
  toggleBookmark,
} from './src/quranBookmarks';

import { saveQuranProgress } from './src/quranProgress';

const QURAN_TEXT_URL = '/quran-uthmani.txt';

type QuranScreenProps = {
  onBack?: () => void;
  initialSurah?: number;
  initialAyah?: number;
};

function getBookmarkKey(
  surahNumber: number,
  ayahNumber: number
): string {
  return `${surahNumber}:${ayahNumber}`;
}

export default function QuranScreen({
  onBack,
  initialSurah,
  initialAyah,
}: QuranScreenProps) {
  const [quran, setQuran] = useState<QuranSurah[]>([]);
  const [selectedSurah, setSelectedSurah] =
    useState<number | null>(null);

  const [language, setLanguage] =
    useState<QuranLanguage>(
      DEFAULT_QURAN_LANGUAGE
    );

  const [translation, setTranslation] =
    useState<TranslationMap>({});

  const [loading, setLoading] = useState(true);
  const [translationLoading, setTranslationLoading] =
    useState(false);

  const [error, setError] = useState('');
  const [translationError, setTranslationError] =
    useState('');

  const [search, setSearch] = useState('');

  const [bookmarkKeys, setBookmarkKeys] =
    useState<Set<string>>(new Set());

  const readerScrollRef =
    useRef<ScrollView>(null);

  const ayahOffsetsRef =
    useRef<Record<number, number>>({});

  const initialNavigationHandled =
    useRef(false);

  const lastSavedProgressRef =
    useRef<string | null>(null);

  const progressSaveTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadQuran();
    initializeBookmarkState();
  }, []);

  useEffect(() => {
    if (language === 'arabic') {
      setTranslation({});
      setTranslationError('');
      return;
    }

    loadTranslation(language);
  }, [language]);

  useEffect(() => {
    if (
      initialNavigationHandled.current ||
      !initialSurah ||
      quran.length === 0
    ) {
      return;
    }

    const requestedSurah = quran.find(
      (surah) =>
        surah.number === initialSurah
    );

    if (!requestedSurah) {
      return;
    }

    initialNavigationHandled.current = true;
    setSelectedSurah(initialSurah);

    saveQuranProgress(
      initialSurah,
      initialAyah && initialAyah > 0
        ? initialAyah
        : 1
    ).catch((err) => {
      console.error(
        'Quran progress save error:',
        err
      );
    });
  }, [quran, initialSurah, initialAyah]);

  useEffect(() => {
    ayahOffsetsRef.current = {};

    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
      progressSaveTimeoutRef.current = null;
    }

    lastSavedProgressRef.current = null;
  }, [selectedSurah]);

  useEffect(() => {
    if (
      selectedSurah === null ||
      !initialAyah ||
      initialAyah <= 0
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const offset =
        ayahOffsetsRef.current[initialAyah];

      if (typeof offset !== 'number') {
        return;
      }

      readerScrollRef.current?.scrollTo({
        y: Math.max(offset - 20, 0),
        animated: true,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedSurah, initialAyah]);

  function handleReaderScroll(scrollY: number) {
    if (selectedSurah === null) {
      return;
    }

    const entries = Object.entries(
      ayahOffsetsRef.current
    )
      .map(([ayahNumber, offset]) => ({
        ayahNumber: Number(ayahNumber),
        offset,
      }))
      .filter(
        (entry) =>
          Number.isFinite(entry.ayahNumber) &&
          Number.isFinite(entry.offset) &&
          entry.offset <= scrollY + 140
      )
      .sort((a, b) => b.offset - a.offset);

    if (entries.length === 0) {
      return;
    }

    const currentAyah = entries[0].ayahNumber;
    const progressKey = `${selectedSurah}:${currentAyah}`;

    if (
      lastSavedProgressRef.current === progressKey
    ) {
      return;
    }

    lastSavedProgressRef.current = progressKey;

    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }

    progressSaveTimeoutRef.current = setTimeout(() => {
      saveQuranProgress(
        selectedSurah,
        currentAyah
      ).catch((err) => {
        console.error(
          'Quran scroll progress save error:',
          err
        );
      });

      progressSaveTimeoutRef.current = null;
    }, 250);
  }

  async function initializeBookmarkState() {
    try {
      await initializeBookmarks();

      const storedBookmarks =
        getBookmarks();

      const keys = new Set(
        storedBookmarks.map((bookmark) =>
          getBookmarkKey(
            bookmark.surahNumber,
            bookmark.ayahNumber
          )
        )
      );

      setBookmarkKeys(keys);
    } catch (err) {
      console.error(
        'Bookmark initialization error:',
        err
      );
    }
  }

  async function handleBookmarkPress(
    surahNumber: number,
    ayahNumber: number
  ) {
    try {
      const bookmarked =
        await toggleBookmark(
          surahNumber,
          ayahNumber
        );

      const key = getBookmarkKey(
        surahNumber,
        ayahNumber
      );

      setBookmarkKeys((previous) => {
        const next = new Set(previous);

        if (bookmarked) {
          next.add(key);
        } else {
          next.delete(key);
        }

        return next;
      });
    } catch (err) {
      console.error(
        'Bookmark update error:',
        err
      );
    }
  }

  async function loadQuran() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        QURAN_TEXT_URL,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Quran file returned ${response.status}`
        );
      }

      const text = await response.text();
      const parsed = parseQuranText(text);

      if (parsed.length !== 114) {
        throw new Error(
          `Expected 114 Surahs but received ${parsed.length}`
        );
      }

      setQuran(parsed);
    } catch (err) {
      console.error(
        'Quran loading error:',
        err
      );

      setError(
        'Unable to load Quran. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTranslation(
    selectedLanguage: QuranLanguage
  ) {
    const url =
      TRANSLATION_FILE_URLS[
        selectedLanguage as Exclude<
          QuranLanguage,
          'arabic'
        >
      ];

    if (!url) {
      return;
    }

    try {
      setTranslationLoading(true);
      setTranslationError('');

      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          `Translation file returned ${response.status}`
        );
      }

      const text = await response.text();

      const parsed =
        parseTranslationText(text);

      setTranslation(parsed);
    } catch (err) {
      console.error(
        'Translation loading error:',
        err
      );

      setTranslation({});

      setTranslationError(
        'This translation is not available yet. Arabic Quran remains available.'
      );
    } finally {
      setTranslationLoading(false);
    }
  }

  const filteredSurahs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return SURAHS;
    }

    return SURAHS.filter(
      (surah) =>
        surah.name
          .toLowerCase()
          .includes(query) ||
        surah.englishName
          .toLowerCase()
          .includes(query) ||
        String(surah.number).includes(
          query
        )
    );
  }, [search]);

  const currentSurah = quran.find(
    (surah) =>
      surah.number === selectedSurah
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading Quran...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={loadQuran}
        >
          <Text style={styles.retryText}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (currentSurah) {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={readerScrollRef}
          contentContainerStyle={
            styles.readerContent
          }
          showsVerticalScrollIndicator={false}
          onScroll={(event) =>
            handleReaderScroll(
              event.nativeEvent.contentOffset.y
            )
          }
          scrollEventThrottle={250}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setSelectedSurah(null);

              if (onBack) {
                onBack();
              }
            }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.backText}>
              Quran
            </Text>
          </Pressable>

          <View style={styles.readerHero}>
            <Text style={styles.surahNumber}>
              SURAH {currentSurah.number}
            </Text>

            <Text
              style={
                styles.arabicSurahName
              }
            >
              {currentSurah.arabicName}
            </Text>

            <Text
              style={
                styles.surahEnglishName
              }
            >
              {currentSurah.englishName}
            </Text>

            <Text style={styles.surahMeta}>
              {currentSurah.revelation} •{' '}
              {currentSurah.ayahCount} Ayahs
            </Text>
          </View>

          <QuranLanguageSelector
            selectedLanguage={language}
            onLanguageChange={setLanguage}
          />

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>
              {
                QURAN_LANGUAGES.find(
                  (item) =>
                    item.id === language
                )?.nativeLabel
              }
            </Text>

            <Text style={styles.sourceText}>
              Arabic text is preserved from
              the existing Uthmani Quran
              source. Translation layers are
              loaded separately.
            </Text>
          </View>

          {translationLoading &&
            language !== 'arabic' && (
              <View
                style={
                  styles.translationLoading
                }
              >
                <ActivityIndicator
                  size="small"
                />

                <Text
                  style={
                    styles.translationLoadingText
                  }
                >
                  Loading translation...
                </Text>
              </View>
            )}

          {translationError &&
            language !== 'arabic' && (
              <View
                style={
                  styles.translationNotice
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#F4C76B"
                />

                <Text
                  style={
                    styles.translationNoticeText
                  }
                >
                  {translationError}
                </Text>
              </View>
            )}

          {currentSurah.ayahs.map(
            (ayah) => {
              const translatedText =
                language === 'arabic'
                  ? ''
                  : getTranslation(
                      translation,
                      currentSurah.number,
                      ayah.number
                    );

              const bookmarkKey =
                getBookmarkKey(
                  currentSurah.number,
                  ayah.number
                );

              return (
                <View
                  key={`${currentSurah.number}-${ayah.number}`}
                  onLayout={(event) => {
                    ayahOffsetsRef.current[
                      ayah.number
                    ] =
                      event.nativeEvent.layout.y;
                  }}
                >
                  <QuranAyahCard
                    ayahNumber={ayah.number}
                    arabicText={ayah.text}
                    translation={
                      translatedText ||
                      undefined
                    }
                    isUrdu={
                      language === 'urdu'
                    }
                    bookmarked={bookmarkKeys.has(
                      bookmarkKey
                    )}
                    onBookmarkPress={() =>
                      handleBookmarkPress(
                        currentSurah.number,
                        ayah.number
                      )
                    }
                  />
                </View>
              );
            }
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>
            THE HOLY QURAN
          </Text>

          <Text style={styles.title}>
            Quran
          </Text>

          <Text style={styles.subtitle}>
            Read, reflect and continue your
            journey with the words of Allah.
          </Text>
        </View>

        <Pressable
          style={styles.continueCard}
          onPress={() => {
            setSelectedSurah(1);

            saveQuranProgress(
              1,
              1
            ).catch((err) => {
              console.error(
                'Quran progress save error:',
                err
              );
            });
          }}
        >
          <View style={styles.continueIcon}>
            <Ionicons
              name="book-outline"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.continueTextContainer
            }
          >
            <Text
              style={styles.continueLabel}
            >
              CONTINUE READING
            </Text>

            <Text
              style={styles.continueTitle}
            >
              Al-Fatihah
            </Text>

            <Text style={styles.continueMeta}>
              Ayah 1
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#8D91A3"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Surah..."
            placeholderTextColor="#777B8A"
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionTitle}>
          All Surahs
        </Text>

        <View style={styles.surahList}>
          {filteredSurahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={styles.surahCard}
              onPress={() => {
                setSelectedSurah(
                  surah.number
                );

                saveQuranProgress(
                  surah.number,
                  1
                ).catch((err) => {
                  console.error(
                    'Quran progress save error:',
                    err
                  );
                });
              }}
            >
              <View
                style={styles.surahNumberBox}
              >
                <Text
                  style={
                    styles.surahNumberText
                  }
                >
                  {surah.number}
                </Text>
              </View>

              <View style={styles.surahInfo}>
                <Text
                  style={styles.surahName}
                >
                  {surah.name}
                </Text>

                <Text
                  style={
                    styles.surahEnglish
                  }
                >
                  {surah.englishName}
                </Text>

                <Text
                  style={
                    styles.surahDetails
                  }
                >
                  {surah.revelation} •{' '}
                  {surah.ayahCount} Ayahs
                </Text>
              </View>

              <View
                style={
                  styles.surahArabicContainer
                }
              >
                <Text
                  style={styles.surahArabic}
                >
                  {surah.arabicName}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#6F7382"
                />
              </View>
            </Pressable>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  readerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0F',
    padding: 24,
  },

  loadingText: {
    color: '#B9BDC9',
    marginTop: 12,
    fontSize: 15,
  },

  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: '#D8B36A',
  },

  retryText: {
    color: '#111111',
    fontWeight: '700',
  },

  hero: {
    marginBottom: 24,
  },

  eyebrow: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 7,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
  },

  subtitle: {
    color: '#969BAA',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 360,
  },

  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151922',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#252A36',
  },

  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B18B45',
  },

  continueTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  continueLabel: {
    color: '#858A9A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  continueTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 3,
  },

  continueMeta: {
    color: '#9B9FAC',
    fontSize: 12,
    marginTop: 2,
  },

  searchContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151D',
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#242833',
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 9,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 28,
    marginBottom: 13,
  },

  surahList: {
    gap: 10,
  },

  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141B',
    borderRadius: 19,
    padding: 14,
    borderWidth: 1,
    borderColor: '#202530',
  },

  surahNumberBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2029',
  },

  surahNumberText: {
    color: '#D8B36A',
    fontSize: 13,
    fontWeight: '800',
  },

  surahInfo: {
    flex: 1,
    marginLeft: 12,
  },

  surahName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  surahEnglish: {
    color: '#9DA1AE',
    fontSize: 12,
    marginTop: 2,
  },

  surahDetails: {
    color: '#666B79',
    fontSize: 10,
    marginTop: 4,
  },

  surahArabicContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  surahArabic: {
    color: '#E9E1D2',
    fontSize: 20,
    marginBottom: 5,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  readerHero: {
    alignItems: 'center',
    backgroundColor: '#11141B',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#252A36',
  },

  surahNumber: {
    color: '#D8B36A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  arabicSurahName: {
    color: '#F0E7D7',
    fontSize: 34,
    marginTop: 10,
  },

  surahEnglishName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 5,
  },

  surahMeta: {
    color: '#8E93A1',
    fontSize: 12,
    marginTop: 7,
  },

  sourceCard: {
    backgroundColor: '#11141B',
    borderRadius: 17,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#202530',
  },

  sourceTitle: {
    color: '#D8B36A',
    fontSize: 13,
    fontWeight: '800',
  },

  sourceText: {
    color: '#858A99',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  translationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  translationLoadingText: {
    color: '#999EAC',
    fontSize: 12,
    marginLeft: 8,
  },

  translationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171710',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  translationNoticeText: {
    flex: 1,
    color: '#C1B891',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
  },
});
