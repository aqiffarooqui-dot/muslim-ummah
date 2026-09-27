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
import { usePremium } from './src/premium/PremiumProvider';
import { useTheme } from './src/themes/ThemeProvider';
import { createThemedStyles } from './src/themes/themeStyleMapper';
import {
  DEFAULT_QURAN_READING_SETTINGS,
  getQuranReadingSettings,
  saveQuranReadingSettings,
  type QuranReadingSettings,
} from './src/quranReadingSettings';
import {
  getQuranInsights,
  getQuranReadingHistory,
  getQuranReadingSummary,
  type QuranInsights,
  type QuranReadingHistoryDay,
  type QuranReadingSummary,
} from './src/quranProgress';

import QuranLanguageSelector from './src/QuranLanguageSelector';
import QuranAyahCard from './src/QuranAyahCard';

import {
  getBookmarks,
  initializeBookmarks,
  toggleBookmark,
} from './src/quranBookmarks';

import { getQuranProgress, saveQuranProgress } from './src/quranProgress';
import { JUZ_RANGES, getJuzRange } from './src/juz/juzRanges';

const QURAN_TEXT_URL =
  'https://raw.githubusercontent.com/cchartm16/quran/master/quran-uthmani.txt';

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

export default }: QuranScreenProps) {
  initialSurah,
  initialAyah,
}: QuranScreenProps) {
  const [quran, setQuran] = useState<QuranSurah[]>([]);
  const [quranProgress, setQuranProgress] = useState<{
    surahNumber: number;
    ayahNumber: number;
  } | null>(null);
  const [selectedSurah, setSelectedSurah] =
    useState<number | null>(null);

  const [selectedJuz, setSelectedJuz] =
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
  const { isPremium } = usePremium();
  const [readingSettings, setReadingSettings] =
    useState<QuranReadingSettings>(DEFAULT_QURAN_READING_SETTINGS);
  const [quranInsights, setQuranInsights] =
    useState<QuranInsights | null>(null);
  const [readingHistory, setReadingHistory] =
    useState<QuranReadingHistoryDay[]>([]);
  const [readingSummary, setReadingSummary] =
    useState<QuranReadingSummary | null>(null);

  const [bookmarkKeys, setBookmarkKeys] =
    useState<Set<string>>(new Set());

  const readerScrollRef =
    useRef<ScrollView>(null);

  const ayahOffsetsRef =
    useRef<Record<number, number>>({});

  /*
   * Exact Ayah navigation request.
   *
   * This remains pending until the requested
   * Ayah has been laid out and the ScrollView
   * is ready to scroll to it.
   */
  const pendingNavigationRef =
    useRef<{
      surahNumber: number;
      ayahNumber: number;
    } | null>(null);

  /*
   * Retry timer used while the ScrollView
   * or requested Ayah is still laying out.
   */
  const navigationRetryTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /*
   * Identifies the last navigation request
   * that was received from App.tsx.
   */
  const lastNavigationKeyRef =
    useRef<string | null>(null);

  /*
   * Prevents normal reading-progress tracking
   * from overwriting the requested Ayah while
   * an exact programmatic navigation is running.
   */
  const exactNavigationActiveRef =
    useRef(false);

  const lastSavedProgressRef =
    useRef<string | null>(null);

  const progressSaveTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  useEffect(() => {
    loadQuran();
    initializeBookmarkState();
    getQuranProgress()
      .then((progress) => setQuranProgress(progress))
      .catch((err) => console.error('Quran progress load error:', err));

    return () => {
      if (
        navigationRetryTimeoutRef.current
      ) {
        clearTimeout(
          navigationRetryTimeoutRef.current
        );

        navigationRetryTimeoutRef.current =
          null;
      }

      if (
        progressSaveTimeoutRef.current
      ) {
        clearTimeout(
          progressSaveTimeoutRef.current
        );

        progressSaveTimeoutRef.current =
          null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isPremium) {
      return;
    }

    Promise.all([
      getQuranReadingSettings(),
      getQuranInsights(),
      getQuranReadingHistory(30),
      getQuranReadingSummary(),
    ])
      .then(([settings, insights, history, summary]) => {
        setReadingSettings(settings);
        setQuranInsights(insights);
        setReadingHistory(history);
        setReadingSummary(summary);
      })
      .catch((err) =>
        console.error('Quran premium tools load error:', err)
      );
  }, [isPremium]);

  useEffect(() => {
    if (language === 'arabic') {
      setTranslation({});
      setTranslationError('');
      return;
    }

    loadTranslation(language);
  }, [language]);

  /*
   * Handle EVERY navigation request coming
   * from App.tsx.
   *
   * Examples:
   * - Home -> Continue Reading
   * - Bookmark -> exact Ayah
   * - Bookmark A -> Bookmark B
   * - reopening the same Ayah
   */
  useEffect(() => {
    if (
      !initialSurah ||
      initialSurah <= 0 ||
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

    const requestedAyah =
      initialAyah && initialAyah > 0
        ? Math.min(
            initialAyah,
            requestedSurah.ayahCount
          )
        : 1;

    const navigationKey =
      `${initialSurah}:${requestedAyah}`;

    /*
     * A new navigation request must reset the
     * reader's layout tracking.
     */
    if (
      lastNavigationKeyRef.current !==
      navigationKey
    ) {
      lastNavigationKeyRef.current =
        navigationKey;

      pendingNavigationRef.current = {
        surahNumber: initialSurah,
        ayahNumber: requestedAyah,
      };

      exactNavigationActiveRef.current =
        true;

      ayahOffsetsRef.current = {};

      if (navigationRetryTimeoutRef.current) {
        clearTimeout(
          navigationRetryTimeoutRef.current
        );

        navigationRetryTimeoutRef.current =
          null;
      }

      if (progressSaveTimeoutRef.current) {
        clearTimeout(
          progressSaveTimeoutRef.current
        );

        progressSaveTimeoutRef.current =
          null;
      }

      lastSavedProgressRef.current = null;

      setSelectedSurah(initialSurah);

      /*
       * Store the requested position immediately
       * so Continue Reading remains correct even
       * before the user starts scrolling.
       */
      saveQuranProgress(
        initialSurah,
        requestedAyah
      ).catch((err) => {
        console.error(
          'Quran navigation progress save error:',
          err
        );
      });
    } else {
      /*
       * Even when the request key is the same,
       * keep the target pending until exact
       * navigation has actually completed.
       */
      pendingNavigationRef.current = {
        surahNumber: initialSurah,
        ayahNumber: requestedAyah,
      };

      exactNavigationActiveRef.current =
        true;

      requestAnimationFrame(() => {
        scrollToPendingAyah();
      });
    }
  }, [quran, initialSurah, initialAyah]);

  /*
   * Reset Ayah layout tracking whenever the
   * selected Surah changes.
   */
  useEffect(() => {
    ayahOffsetsRef.current = {};

    if (progressSaveTimeoutRef.current) {
      clearTimeout(
        progressSaveTimeoutRef.current
      );

      progressSaveTimeoutRef.current =
        null;
    }

    lastSavedProgressRef.current = null;

    if (
      selectedSurah !== null &&
      pendingNavigationRef.current &&
      pendingNavigationRef.current.surahNumber ===
        selectedSurah
    ) {
      requestAnimationFrame(() => {
        scrollToPendingAyah();
      });
    }
  }, [selectedSurah]);

  /*
   * Schedule another exact-navigation attempt.
   */
  function scheduleExactNavigationRetry() {
    if (
      navigationRetryTimeoutRef.current
    ) {
      return;
    }

    navigationRetryTimeoutRef.current =
      setTimeout(() => {
        navigationRetryTimeoutRef.current =
          null;

        scrollToPendingAyah();
      }, 150);
  }

  /*
   * Scroll exactly to the requested Ayah.
   *
   * The important part here is that we do not
   * clear the pending request immediately.
   *
   * We wait for:
   * 1. Ayah layout
   * 2. ScrollView layout
   * 3. Two animation frames
   * 4. A verification/retry pass
   */
  function scrollToPendingAyah() {
    const pending =
      pendingNavigationRef.current;

    if (!pending) {
      return;
    }

    if (
      selectedSurah !== pending.surahNumber
    ) {
      return;
    }

    const offset =
      ayahOffsetsRef.current[
        pending.ayahNumber
      ];

    if (typeof offset !== 'number') {
      scheduleExactNavigationRetry();
      return;
    }

    exactNavigationActiveRef.current =
      true;

    if (
      navigationRetryTimeoutRef.current
    ) {
      clearTimeout(
        navigationRetryTimeoutRef.current
      );

      navigationRetryTimeoutRef.current =
        null;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const latestPending =
          pendingNavigationRef.current;

        if (!latestPending) {
          exactNavigationActiveRef.current =
            false;

          return;
        }

        if (
          selectedSurah !==
          latestPending.surahNumber
        ) {
          return;
        }

        const latestOffset =
          ayahOffsetsRef.current[
            latestPending.ayahNumber
          ];

        if (
          typeof latestOffset !== 'number'
        ) {
          scheduleExactNavigationRetry();
          return;
        }

        readerScrollRef.current?.scrollTo({
          y: Math.max(
            latestOffset - 24,
            0
          ),
          animated: false,
        });

        /*
         * Verify the scroll after the ScrollView
         * has had time to process the first one.
         */
        if (
          navigationRetryTimeoutRef.current
        ) {
          clearTimeout(
            navigationRetryTimeoutRef.current
          );
        }

        navigationRetryTimeoutRef.current =
          setTimeout(() => {
            navigationRetryTimeoutRef.current =
              null;

            const finalPending =
              pendingNavigationRef.current;

            if (!finalPending) {
              exactNavigationActiveRef.current =
                false;

              return;
            }

            if (
              selectedSurah !==
              finalPending.surahNumber
            ) {
              return;
            }

            const finalOffset =
              ayahOffsetsRef.current[
                finalPending.ayahNumber
              ];

            if (
              typeof finalOffset ===
              'number'
            ) {
              readerScrollRef.current?.scrollTo({
                y: Math.max(
                  finalOffset - 24,
                  0
                ),
                animated: false,
              });
            }

            /*
             * Exact navigation is now considered
             * complete.
             */
            pendingNavigationRef.current =
              null;

            exactNavigationActiveRef.current =
              false;

            /*
             * The requested position is explicitly
             * stored again after successful navigation
             * so normal scroll handling cannot replace
             * it with Ayah 1.
             */
            saveQuranProgress(
              finalPending.surahNumber,
              finalPending.ayahNumber
            ).catch((err) => {
              console.error(
                'Quran exact navigation progress save error:',
                err
              );
            });

            lastSavedProgressRef.current =
              `${finalPending.surahNumber}:${finalPending.ayahNumber}`;
          }, 250);
      });
    });
  }

  /*
   * Called whenever ScrollView content size
   * changes.
   */
  function handleContentSizeChange() {
    if (!pendingNavigationRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToPendingAyah();
    });
  }

  /*
   * Called after every Ayah is laid out.
   */
  function handleAyahLayout(
    ayahNumber: number,
    y: number
  ) {
    ayahOffsetsRef.current[ayahNumber] =
      y;

    const pending =
      pendingNavigationRef.current;

    if (
      pending &&
      pending.surahNumber === selectedSurah &&
      pending.ayahNumber === ayahNumber
    ) {
      requestAnimationFrame(() => {
        scrollToPendingAyah();
      });
    }
  }

  /*
   * Save normal reading progress while the
   * user manually scrolls.
   *
   * During exact navigation this is disabled
   * temporarily so it cannot overwrite the
   * requested Ayah.
   */
  function handleReaderScroll(
    scrollY: number
  ) {
    if (
      selectedSurah === null ||
      exactNavigationActiveRef.current
    ) {
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
          Number.isFinite(
            entry.ayahNumber
          ) &&
          Number.isFinite(entry.offset) &&
          entry.offset <= scrollY + 140
      )
      .sort(
        (a, b) =>
          b.offset - a.offset
      );

    if (entries.length === 0) {
      return;
    }

    const currentAyah =
      entries[0].ayahNumber;

    const progressKey =
      `${selectedSurah}:${currentAyah}`;

    if (
      lastSavedProgressRef.current ===
      progressKey
    ) {
      return;
    }

    lastSavedProgressRef.current =
      progressKey;

    if (progressSaveTimeoutRef.current) {
      clearTimeout(
        progressSaveTimeoutRef.current
      );
    }

    progressSaveTimeoutRef.current =
      setTimeout(() => {
        /*
         * Check again because exact navigation
         * may have started while this timer
         * was waiting.
         */
        if (
          exactNavigationActiveRef.current
        ) {
          progressSaveTimeoutRef.current =
            null;

          return;
        }

        saveQuranProgress(
          selectedSurah,
          currentAyah
        ).catch((err) => {
          console.error(
            'Quran scroll progress save error:',
            err
          );
        });

        progressSaveTimeoutRef.current =
          null;
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

      const totalAyahs = parsed.reduce(
        (sum, surah) => sum + surah.ayahs.length,
        0
      );

      if (parsed.length !== 114 || totalAyahs < 6000) {
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

  const normalizedSearch = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .trim();

  const filteredSurahs = useMemo(() => {
    const query = normalizedSearch(search);

    if (!query) {
      return SURAHS;
    }

    return SURAHS.filter(
      (surah) =>
        normalizedSearch(surah.name).includes(query) ||
        normalizedSearch(surah.englishName).includes(query) ||
        normalizedSearch(surah.arabicName).includes(query) ||
        String(surah.number) === query
    );
  }, [search]);

  const ayahSearchResults = useMemo(() => {
    const query = normalizedSearch(search);

    if (!query || quran.length === 0) {
      return [];
    }

    const exactReference = query.match(/^(\\d{1,3})\\s*[:.-]\\s*(\\d{1,3})$/);
    const results: Array<{
      surahNumber: number;
      ayahNumber: number;
      text: string;
    }> = [];

    for (const surah of quran) {
      for (const ayah of surah.ayahs) {
        const referenceMatches =
          exactReference &&
          Number(exactReference[1]) === surah.number &&
          Number(exactReference[2]) === ayah.number;

        const textMatches =
          normalizedSearch(ayah.text).includes(query);

        if (referenceMatches || textMatches) {
          results.push({
            surahNumber: surah.number,
            ayahNumber: ayah.ayahNumber,
            text: ayah.text,
          });
        }

        if (results.length >= 40) {
          return results;
        }
      }
    }

    return results;
  }, [quran, search]);

  function openAyahFromSearch(
    surahNumber: number,
    ayahNumber: number
  ) {
    pendingNavigationRef.current = {
      surahNumber,
      ayahNumber,
    };
    exactNavigationActiveRef.current = true;
    ayahOffsetsRef.current = {};
    lastNavigationKeyRef.current =
      'search:' + surahNumber + ':' + ayahNumber;

    setSelectedJuz(null);
    setSelectedSurah(surahNumber);

    saveQuranProgress(
      surahNumber,
      ayahNumber
    ).catch((err) => {
      console.error(
        'Quran search navigation progress error:',
        err
      );
    });
  }

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

  if (selectedJuz !== null && !currentSurah) {
    const juz = getJuzRange(selectedJuz);

    if (juz) {
      const juzSurahs = quran.filter(
        (surah) =>
          surah.number >= juz.startSurah &&
          surah.number <= juz.endSurah
      );

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.readerContent}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={styles.backButton}
              onPress={() => setSelectedJuz(null)}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              <Text style={styles.backText}>Quran • Paras</Text>
            </Pressable>

            <View style={styles.readerHero}>
              <Text style={styles.surahNumber}>PARA {juz.juz}</Text>
              <Text style={styles.arabicSurahName}>الجزء {juz.juz}</Text>
              <Text style={styles.surahEnglishName}>{juz.name}</Text>
              <Text style={styles.surahMeta}>
                {juz.startSurah}:{juz.startAyah} → {juz.endSurah}:{juz.endAyah}
              </Text>
            </View>

            <QuranLanguageSelector
              selectedLanguage={language}
              onLanguageChange={setLanguage}
            />

            {translationLoading && language !== 'arabic' && (
              <View style={styles.translationLoading}>
                <ActivityIndicator size="small" />
                <Text style={styles.translationLoadingText}>
                  Loading translation...
                </Text>
              </View>
            )}

            {translationError && language !== 'arabic' && (
              <View style={styles.translationNotice}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#F4C76B"
                />
                <Text style={styles.translationNoticeText}>
                  {translationError}
                </Text>
              </View>
            )}

            {juzSurahs.map((surah) => {
              const fromAyah =
                surah.number === juz.startSurah ? juz.startAyah : 1;
              const toAyah =
                surah.number === juz.endSurah
                  ? juz.endAyah
                  : surah.ayahCount;

              const ayahs = surah.ayahs.filter(
                (ayah) =>
                  ayah.number >= fromAyah &&
                  ayah.number <= toAyah
              );

              return (
                <View key={surah.number}>
                  <View style={styles.juzSurahHeader}>
                    <Text style={styles.juzSurahNumber}>
                      SURAH {surah.number}
                    </Text>
                    <Text style={styles.juzSurahName}>
                      {surah.englishName}
                    </Text>
                    <Text style={styles.juzSurahArabic}>
                      {surah.arabicName}
                    </Text>
                  </View>

                  {ayahs.map((ayah) => {
                    const translatedText =
                      language === 'arabic'
                        ? ''
                        : getTranslation(
                            translation,
                            surah.number,
                            ayah.number
                          );

                    const bookmarkKey = getBookmarkKey(
                      surah.number,
                      ayah.number
                    );

                    return (
                      <QuranAyahCard
                        key={`juz-${selectedJuz}-${surah.number}-${ayah.number}`}
                        surahNumber={surah.number}
                        ayahNumber={ayah.number}
                        arabicText={ayah.text}
                        translation={translatedText || undefined}
                        isUrdu={language === 'urdu'}
                        bookmarked={bookmarkKeys.has(bookmarkKey)}
                        onBookmarkPress={() =>
                          handleBookmarkPress(
                            surah.number,
                            ayah.number
                          )
                        }
                      />
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      );
    }
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
          onContentSizeChange={
            handleContentSizeChange
          }
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
              if (
                navigationRetryTimeoutRef.current
              ) {
                clearTimeout(
                  navigationRetryTimeoutRef.current
                );

                navigationRetryTimeoutRef.current =
                  null;
              }

              if (
                progressSaveTimeoutRef.current
              ) {
                clearTimeout(
                  progressSaveTimeoutRef.current
                );

                progressSaveTimeoutRef.current =
                  null;
              }

              pendingNavigationRef.current =
                null;

              lastNavigationKeyRef.current =
                null;

              exactNavigationActiveRef.current =
                false;

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
                    handleAyahLayout(
                      ayah.number,
                      event.nativeEvent.layout.y
                    );
                  }}
                >
                  <QuranAyahCard
                    surahNumber={currentSurah.number}
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
            const surahNumber =
              quranProgress?.surahNumber ?? 1;
            const ayahNumber =
              quranProgress?.ayahNumber ?? 1;

            setSelectedSurah(surahNumber);

            saveQuranProgress(
              surahNumber,
              ayahNumber
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
              {quranProgress
                ? SURAHS[quranProgress.surahNumber - 1]?.englishName ?? 'Continue Quran'
                : 'Al-Fatihah'}
            </Text>

            <Text style={styles.continueMeta}>
              {quranProgress
                ? `Ayah ${quranProgress.ayahNumber}`
                : 'Ayah 1'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#FFFFFF"
          />
        </Pressable>


        {isPremium && (
          <View style={styles.premiumToolsCard}>
            <View style={styles.premiumToolsHeader}>
              <View style={styles.premiumToolsTitleRow}>
                <Ionicons name="sparkles" size={18} color="#D8B36A" />
                <Text style={styles.premiumToolsTitle}>Premium Quran Tools</Text>
              </View>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            </View>

            <Text style={styles.premiumToolsText}>
              Advanced reading controls, Quran insights and reading history.
            </Text>

            <Text style={styles.premiumControlLabel}>
              Arabic text size · {readingSettings.fontSize}px
            </Text>
            <View style={styles.row}>
              <Pressable
                style={styles.premiumAction}
                onPress={async () => {
                  const next = {
                    ...readingSettings,
                    fontSize: Math.max(20, readingSettings.fontSize - 2),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                }}
              >
                <Text style={styles.premiumActionText}>A−</Text>
              </Pressable>
              <View style={styles.premiumValue}>
                <Text style={styles.premiumValueText}>{readingSettings.fontSize}px</Text>
              </View>
              <Pressable
                style={styles.premiumAction}
                onPress={async () => {
                  const next = {
                    ...readingSettings,
                    fontSize: Math.min(36, readingSettings.fontSize + 2),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                }}
              >
                <Text style={styles.premiumActionText}>A+</Text>
              </Pressable>
            </View>

            <Text style={styles.premiumControlLabel}>
              Reading mode
            </Text>
            <View style={styles.row}>
              {(['comfortable', 'compact'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.premiumMode,
                    readingSettings.mode === mode && styles.premiumModeActive,
                  ]}
                  onPress={async () => {
                    const next = { ...readingSettings, mode };
                    await saveQuranReadingSettings(next);
                    setReadingSettings(next);
                  }}
                >
                  <Text
                    style={[
                      styles.premiumModeText,
                      readingSettings.mode === mode && styles.premiumModeTextActive,
                    ]}
                  >
                    {mode === 'comfortable' ? 'Comfortable' : 'Compact'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {quranInsights && readingSummary && (
              <>
                <View style={styles.premiumStatsRow}>
                  <View style={styles.premiumStat}>
                    <Text style={styles.premiumStatValue}>{quranInsights.currentStreak}</Text>
                    <Text style={styles.premiumStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.premiumStat}>
                    <Text style={styles.premiumStatValue}>{readingSummary.last7Days}</Text>
                    <Text style={styles.premiumStatLabel}>7 Days</Text>
                  </View>
                  <View style={styles.premiumStat}>
                    <Text style={styles.premiumStatValue}>{readingSummary.last30Days}</Text>
                    <Text style={styles.premiumStatLabel}>30 Days</Text>
                  </View>
                </View>

                <Text style={styles.premiumHistoryTitle}>Reading History · 30 Days</Text>
                <View style={styles.premiumHistory}>
                  {readingHistory.map((day) => (
                    <View key={day.date} style={styles.premiumHistoryRow}>
                      <Text style={styles.premiumHistoryDate}>
                        {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      <View style={styles.premiumHistoryTrack}>
                        <View
                          style={[
                            styles.premiumHistoryFill,
                            {
                              width:
                                Math.min(
                                  100,
                                  day.goal > 0 ? (day.count / day.goal) * 100 : 0
                                ) + '%',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.premiumHistoryCount}>{day.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

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

        {search.trim().length > 0 && (
          <View style={styles.searchResultsSection}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.sectionTitle}>
                Quran Ayahs
              </Text>
              <Text style={styles.searchResultsCount}>
                {ayahSearchResults.length > 0
                  ? 'Showing up to ' + ayahSearchResults.length
                  : 'No Ayah match'}
              </Text>
            </View>

            {ayahSearchResults.map((result) => {
              const surah = SURAHS[result.surahNumber - 1];

              return (
                <Pressable
                  key={result.surahNumber + ':' + result.ayahNumber}
                  style={styles.searchResultCard}
                  onPress={() =>
                    openAyahFromSearch(
                      result.surahNumber,
                      result.ayahNumber
                    )
                  }
                >
                  <View style={styles.searchResultTop}>
                    <Text style={styles.searchResultReference}>
                      {result.surahNumber}:{result.ayahNumber}
                    </Text>
                    <Text style={styles.searchResultSurah}>
                      {surah?.englishName ?? 'Quran'}
                    </Text>
                  </View>

                  <Text
                    style={styles.searchResultArabic}
                    numberOfLines={3}
                  >
                    {result.text}
                  </Text>

                  <View style={styles.searchResultAction}>
                    <Text style={styles.searchResultActionText}>
                      Open Ayah
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={15}
                      color="#D8B36A"
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          30 Paras / Juz
        </Text>

        <View style={styles.juzList}>
          {JUZ_RANGES.map((juz) => (
            <Pressable
              key={juz.juz}
              style={styles.juzCard}
              onPress={() => {
                setSelectedSurah(null);
                setSelectedJuz(juz.juz);
              }}
            >
              <View style={styles.juzNumberBox}>
                <Text style={styles.juzNumberText}>{juz.juz}</Text>
              </View>

              <View style={styles.juzInfo}>
                <Text style={styles.juzName}>Para {juz.juz} • {juz.name}</Text>
                <Text style={styles.juzRangeText}>
                  {juz.startSurah}:{juz.startAyah} → {juz.endSurah}:{juz.endAyah}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#6F7382"
              />
            </Pressable>
          ))}
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

const createLegacyStyles = (theme: any) => createThemedStyles(theme, {
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

  searchResultsSection: {
    marginBottom: 8,
  },

  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  searchResultsCount: {
    color: '#777B8A',
    fontSize: 11,
    fontWeight: '600',
  },

  searchResultCard: {
    backgroundColor: '#11141B',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#252A36',
  },

  searchResultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  searchResultReference: {
    color: '#D8B36A',
    fontSize: 13,
    fontWeight: '900',
  },

  searchResultSurah: {
    color: '#9DA1AE',
    fontSize: 11,
    fontWeight: '600',
  },

  searchResultArabic: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  searchResultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 8,
  },

  searchResultActionText: {
    color: '#D8B36A',
    fontSize: 12,
    fontWeight: '800',
  },

  juzList: { gap: 10 },

  juzCard: {
    flexDirection: 'row', alignItems: 'center', minHeight: 72,
    backgroundColor: '#11141B', borderRadius: 19,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#252A36',
  },

  juzNumberBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1C2029', borderWidth: 1, borderColor: '#343A48',
  },

  juzNumberText: { color: '#D8B36A', fontSize: 15, fontWeight: '900' },

  juzInfo: { flex: 1, minWidth: 0, marginLeft: 13 },

  juzName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', lineHeight: 21 },

  juzRangeText: { color: '#9DA1AE', fontSize: 11, fontWeight: '500', marginTop: 4, lineHeight: 16 },

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

  premiumToolsCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#806B3D',
  },

  premiumToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  premiumToolsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  premiumToolsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  premiumBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#806B3D',
  },

  premiumBadgeText: {
    color: '#D8B36A',
    fontSize: 7,
    fontWeight: '900',
  },

  premiumToolsText: {
    color: '#858B99',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  premiumControlLabel: {
    color: '#9DA1AE',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  premiumAction: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#806B3D',
    alignItems: 'center',
  },

  premiumActionText: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '900',
  },

  premiumValue: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#252A35',
    alignItems: 'center',
  },

  premiumValueText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  premiumMode: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#252A35',
    alignItems: 'center',
  },

  premiumModeActive: {
    backgroundColor: '#211F18',
    borderColor: '#806B3D',
  },

  premiumModeText: {
    color: '#858B99',
    fontSize: 10,
    fontWeight: '800',
  },

  premiumModeTextActive: {
    color: '#D8B36A',
  },

  premiumStatsRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
  },

  premiumStat: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#151922',
    alignItems: 'center',
  },

  premiumStatValue: {
    color: '#D8B36A',
    fontSize: 18,
    fontWeight: '900',
  },

  premiumStatLabel: {
    color: '#858B99',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 3,
  },

  premiumHistoryTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 7,
  },

  premiumHistory: {
    gap: 5,
  },

  premiumHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 22,
  },

  premiumHistoryDate: {
    width: 43,
    color: '#858B99',
    fontSize: 7,
    fontWeight: '700',
  },

  premiumHistoryTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#252A35',
    overflow: 'hidden',
  },

  premiumHistoryFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D8B36A',
  },

  premiumHistoryCount: {
    width: 18,
    textAlign: 'right',
    color: '#858B99',
    fontSize: 8,
    fontWeight: '800',
  },
});
