import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Slider from '@react-native-community/slider';

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
  type QuranAudioMode,
  type QuranReaderViewMode,
} from './src/quranReadingSettings';
import {
  getQuranInsights,
  getQuranReadingHistory,
  getQuranReadingSummary,
  type QuranInsights,
  type QuranReadingHistoryDay,
  type QuranReadingSummary,
} from './src/quranProgress';

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

type MushafPageAyah = { surahNumber: number; ayah: QuranSurah['ayahs'][number] };

export default function QuranScreen({
  onBack,
  initialSurah,
  initialAyah,
}: QuranScreenProps) {
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme);
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
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [bookmarksVisible, setBookmarksVisible] = useState(false);
  const [fullQuranVisible, setFullQuranVisible] = useState(false);
  const [fullQuranPageIndex, setFullQuranPageIndex] = useState(0);
  const [fullQuranPageMap, setFullQuranPageMap] = useState<Record<string, number>>({});
  const [fullQuranPageLoading, setFullQuranPageLoading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const pageAudioEndRef = useRef<number | null>(null);
  const [pageMap, setPageMap] = useState<Record<string, number>>({});
  const [pageLoading, setPageLoading] = useState(false);
  const [audioAyahIndex, setAudioAyahIndex] = useState<number | null>(null);
  const audioCompletionRef = useRef(false);
  const audioPlayer = useAudioPlayer(null, { updateInterval: 250 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);
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
    getQuranReadingSettings()
      .then(setReadingSettings)
      .catch((err) =>
        console.error('Quran reading settings load error:', err)
      );

    Promise.all([
      getQuranReadingHistory(30),
      getQuranReadingSummary(),
      isPremium ? getQuranInsights() : Promise.resolve(null),
    ])
      .then(([history, summary, insights]) => {
        setReadingHistory(history);
        setReadingSummary(summary);
        setQuranInsights(insights);
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


  useEffect(() => {
    if (!fullQuranVisible || quran.length === 0 || Object.keys(fullQuranPageMap).length > 0) return;
    let cancelled = false;
    async function loadFullQuranPages() {
      try {
        setFullQuranPageLoading(true);
        const maps = await Promise.all(quran.map(async (surah) => {
          const response = await fetch(
            `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surah.number}`,
            { cache: 'no-store' }
          );
          if (!response.ok) throw new Error(`Full Quran page metadata returned ${response.status}`);
          const data = await response.json();
          const result: Record<string, number> = {};
          for (const verse of data?.verses ?? []) {
            const parts = String(verse?.verse_key ?? '').split(':');
            const ayahNumber = Number(parts[1]);
            const pageNumber = Number(verse?.page_number);
            if (Number.isFinite(ayahNumber) && Number.isFinite(pageNumber)) {
              result[`${surah.number}:${ayahNumber}`] = pageNumber;
            }
          }
          return result;
        }));
        if (!cancelled) setFullQuranPageMap(Object.assign({}, ...maps));
      } catch (err) {
        console.error('Full Quran page metadata load error:', err);
      } finally {
        if (!cancelled) setFullQuranPageLoading(false);
      }
    }
    loadFullQuranPages();
    return () => { cancelled = true; };
  }, [fullQuranVisible, quran, fullQuranPageMap]);
  useEffect(() => {
    if (!selectedSurah) { setPageMap({}); return; }
    let cancelled = false;
    async function loadPageMap() {
      try {
        setPageLoading(true);
        const chaptersResponse = await fetch('https://api.quran.com/api/v4/chapters?language=en', { cache: 'no-store' });
        if (!chaptersResponse.ok) throw new Error(`Chapter metadata returned ${chaptersResponse.status}`);
        const chapters = (await chaptersResponse.json())?.chapters ?? [];
        const selectedMeta = chapters.find((chapter: any) => chapter.id === selectedSurah);
        const selectedPages = selectedMeta?.pages;
        if (!Array.isArray(selectedPages) || selectedPages.length < 2) throw new Error('Selected Surah page range unavailable');
        const pageStart = Number(selectedPages[0]);
        const pageEnd = Number(selectedPages[1]);
        const overlapping = chapters.filter((chapter: any) => {
          const pages = chapter?.pages;
          return Array.isArray(pages) && pages.length >= 2 && Number(pages[0]) <= pageEnd && Number(pages[1]) >= pageStart;
        }).map((chapter: any) => Number(chapter.id)).filter(Number.isFinite);
        const maps = await Promise.all(overlapping.map(async (surahNumber: number) => {
          const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`, { cache: 'no-store' });
          if (!response.ok) throw new Error(`Page metadata returned ${response.status}`);
          const data = await response.json();
          const result: Record<string, number> = {};
          for (const verse of data?.verses ?? []) {
            const parts = String(verse?.verse_key ?? '').split(':');
            const ayahNumber = Number(parts[1]);
            const pageNumber = Number(verse?.page_number);
            if (Number.isFinite(ayahNumber) && Number.isFinite(pageNumber)) result[`${surahNumber}:${ayahNumber}`] = pageNumber;
          }
          return result;
        }));
        if (!cancelled) setPageMap(Object.assign({}, ...maps));
      } catch (err) {
        console.error('Quran page metadata load error:', err);
        if (!cancelled) setPageMap({});
      } finally { if (!cancelled) setPageLoading(false); }
    }
    loadPageMap();
    return () => { cancelled = true; };
  }, [selectedSurah]);

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
    setCurrentPageIndex(0);

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

  function openExactAyah(surahNumber: number, ayahNumber: number) {
    pendingNavigationRef.current = { surahNumber, ayahNumber };
    exactNavigationActiveRef.current = true;
    ayahOffsetsRef.current = {};
    lastNavigationKeyRef.current = 'direct:' + surahNumber + ':' + ayahNumber;
    setSelectedJuz(null);
    setSelectedSurah(surahNumber);
    saveQuranProgress(surahNumber, ayahNumber).catch((err) =>
      console.error('Quran exact navigation save error:', err)
    );
  }

  function openBookmarks() {
    setBookmarksVisible(true);
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

        const arabicMatches =
          normalizedSearch(ayah.text).includes(query);

        const translationText =
          language !== 'arabic'
            ? getTranslation(
                translation,
                surah.number,
                ayah.number
              )
            : '';

        const translationMatches =
          Boolean(translationText) &&
          normalizedSearch(translationText).includes(query);

        if (
          referenceMatches ||
          arabicMatches ||
          translationMatches
        ) {
          results.push({
            surahNumber: surah.number,
            ayahNumber: ayah.number,
            text: ayah.text,
          });
        }

        if (results.length >= 40) {
          return results;
        }
      }
    }

    return results;
  }, [quran, search, language, translation]);

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

  function playAyahAudio(ayahNumber: number) {
    if (!isPremium || !currentSurah) return;

    pageAudioEndRef.current = null;
    const index = currentSurah.ayahs.findIndex(
      (ayah) => ayah.number === ayahNumber
    );
    if (index < 0) return;

    audioCompletionRef.current = false;
    setAudioAyahIndex(index);
    audioPlayer.replace(
      `https://everyayah.com/data/Alafasy_128kbps/${String(currentSurah.number).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`
    );
    audioPlayer.play();
  }

  function playPageAudio() {
    if (!isPremium || !currentSurah || pageGroups.length === 0) return;
    if (audioStatus.playing && pageAudioEndRef.current !== null) {
      audioPlayer.pause();
      return;
    }

    const page = pageGroups[currentPageIndex];
    if (!page) return;

    const endIndex = currentSurah.ayahs.findIndex(
      (ayah) => ayah.number === page[1][page[1].length - 1].number
    );

    if (endIndex < 0) return;

    playAyahAudio(page[1][0].number);
    pageAudioEndRef.current = endIndex;
  }

  function updateReadingSettings(next: QuranReadingSettings) {
    setReadingSettings(next);
    saveQuranReadingSettings(next).catch((err) =>
      console.error('Quran reading settings save error:', err)
    );
  }

  function renderAyahCard(ayah: QuranSurah['ayahs'][number]) {
    const translatedText =
      readingSettings.showTranslation && language !== 'arabic'
        ? getTranslation(translation, currentSurah?.number ?? 0, ayah.number)
        : '';
    const bookmarkKey = getBookmarkKey(currentSurah?.number ?? 0, ayah.number);
    const isPlaying = audioAyahIndex !== null &&
      currentSurah?.ayahs[audioAyahIndex]?.number === ayah.number &&
      audioStatus.playing;

    return (
      <View
        key={`ayah-${currentSurah?.number ?? 0}-${ayah.number}`}
        onLayout={(event) =>
          handleAyahLayout(ayah.number, event.nativeEvent.layout.y)
        }
      >
        <QuranAyahCard
          surahNumber={currentSurah?.number ?? 0}
          ayahNumber={ayah.number}
          arabicText={ayah.text}
          translation={translatedText || undefined}
          isUrdu={language === 'urdu'}
          bookmarked={bookmarkKeys.has(bookmarkKey)}
          onBookmarkPress={() =>
            handleBookmarkPress(currentSurah?.number ?? 0, ayah.number)
          }
          onBookPress={() => setFullQuranVisible(true)}
          onPlayAyah={() => playAyahAudio(ayah.number)}
          fontSize={readingSettings.fontSize}
          lineSpacing={readingSettings.lineSpacing}
          isPlaying={isPlaying}
        />
      </View>
    );
  }

  const currentSurah = quran.find(
    (surah) =>
      surah.number === selectedSurah
  );

  const pageGroups = useMemo<Array<[number, MushafPageAyah[]]>>(() => {
    if (!currentSurah) return [];
    const groups = new Map<number, MushafPageAyah[]>();
    for (const surah of quran) for (const ayah of surah.ayahs) {
      const page = pageMap[`${surah.number}:${ayah.number}`];
      if (!page) continue;
      if (!groups.has(page)) groups.set(page, []);
      groups.get(page)!.push({ surahNumber: surah.number, ayah });
    }
    return Array.from(groups.entries()).filter(([, entries]) => entries.some((entry) => entry.surahNumber === currentSurah.number)).sort((a,b) => a[0]-b[0]);
  }, [currentSurah, quran, pageMap]);  const pageGroups = useMemo<Array<[number, MushafPageAyah[]]>>(() => {
    if (!currentSurah) return [];
    const groups = new Map<number, MushafPageAyah[]>();
    for (const surah of quran) for (const ayah of surah.ayahs) {
      const page = pageMap[`${surah.number}:${ayah.number}`];
      if (!page) continue;
      if (!groups.has(page)) groups.set(page, []);
      groups.get(page)!.push({ surahNumber: surah.number, ayah });
    }
    return Array.from(groups.entries()).filter(([, entries]) => entries.some((entry) => entry.surahNumber === currentSurah.number)).sort((a,b) => a[0]-b[0]);
  }, [currentSurah, quran, pageMap]);

  const fullQuranPageGroups = useMemo<Array<[number, MushafPageAyah[]]>>(() => {
    const groups = new Map<number, MushafPageAyah[]>();
    for (const surah of quran) for (const ayah of surah.ayahs) {
      const page = fullQuranPageMap[`${surah.number}:${ayah.number}`];
      if (!page) continue;
      if (!groups.has(page)) groups.set(page, []);
      groups.get(page)!.push({ surahNumber: surah.number, ayah });
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [quran, fullQuranPageMap]);

  useEffect(() => {
    if (
      readingSettings.viewMode !== 'page' ||
      !pendingNavigationRef.current ||
      pageGroups.length === 0
    ) {
      return;
    }

    const pending = pendingNavigationRef.current;
    if (pending.surahNumber !== selectedSurah) {
      return;
    }

    const pageIndex = pageGroups.findIndex(([, ayahs]) =>
      ayahs.some((entry) => entry.surahNumber === pending.surahNumber && entry.ayah.number === pending.ayahNumber)
    );

    if (pageIndex < 0) return;

    setCurrentPageIndex(pageIndex);
    pendingNavigationRef.current = null;
    exactNavigationActiveRef.current = false;
    lastSavedProgressRef.current =
      pending.surahNumber + ':' + pending.ayahNumber;

    saveQuranProgress(
      pending.surahNumber,
      pending.ayahNumber
    ).catch((err) => {
      console.error('Quran page navigation progress error:', err);
    });
  }, [readingSettings.viewMode, pageGroups, selectedSurah]);

  useEffect(() => {
    if (
      readingSettings.viewMode !== 'page' ||
      audioAyahIndex === null ||
      pageGroups.length === 0
    ) {
      return;
    }

    const currentAyahNumber = currentSurah?.ayahs[audioAyahIndex]?.number;
    const pageIndex = pageGroups.findIndex(([, ayahs]) =>
      ayahs.some((entry) => entry.surahNumber === selectedSurah && entry.ayah.number === currentAyahNumber)
    );

    if (pageIndex >= 0 && pageIndex !== currentPageIndex) {
      setCurrentPageIndex(pageIndex);
    }
  }, [
    readingSettings.viewMode,
    audioAyahIndex,
    currentPageIndex,
    pageGroups,
    currentSurah,
  ]);

  useEffect(() => {
    if (
      !audioStatus.didJustFinish ||
      !currentSurah ||
      (readingSettings.audioMode !== 'continuous' &&
        pageAudioEndRef.current === null) ||
      audioAyahIndex === null ||
      audioCompletionRef.current
    ) {
      return;
    }

    audioCompletionRef.current = true;
    const nextIndex = audioAyahIndex + 1;

    if (
      pageAudioEndRef.current !== null &&
      nextIndex > pageAudioEndRef.current
    ) {
      pageAudioEndRef.current = null;
      setAudioAyahIndex(null);
      return;
    }

    if (nextIndex >= currentSurah.ayahs.length) {
      setAudioAyahIndex(null);
      return;
    }

    const nextAyah = currentSurah.ayahs[nextIndex];
    setAudioAyahIndex(nextIndex);
    audioPlayer.replace(
      `https://everyayah.com/data/Alafasy_128kbps/${String(currentSurah.number).padStart(3, '0')}${String(nextAyah.number).padStart(3, '0')}.mp3`
    );
    audioPlayer.play();

    setTimeout(() => {
      audioCompletionRef.current = false;
    }, 300);
  }, [
    audioStatus.didJustFinish,
    readingSettings.audioMode,
    audioAyahIndex,
    currentSurah,
    audioPlayer,
  ]);


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


            {juzSurahs.map((surah) => (
              <Pressable
                key={surah.number}
                style={styles.surahCard}
                onPress={() => {
                  setSelectedSurah(surah.number);
                  saveQuranProgress(surah.number, 1).catch((err) =>
                    console.error('Quran juz navigation progress error:', err)
                  );
                }}
              >
                <View style={styles.surahNumberBox}>
                  <Text style={styles.surahNumberText}>{surah.number}</Text>
                </View>
                <View style={styles.surahInfo}>
                  <Text style={styles.surahName}>{surah.name}</Text>
                  <Text style={styles.surahEnglish}>{surah.englishName}</Text>
                  <Text style={styles.surahDetails}>
                    {surah.revelation} • {surah.ayahCount} Ayahs
                  </Text>
                </View>
                <View style={styles.surahArabicContainer}>
                  <Text style={styles.surahArabic}>{surah.arabicName}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#6F7382" />
                </View>
              </Pressable>
            ))}

            <View style={styles.juzFooterHint}>
              <Ionicons name="information-circle-outline" size={16} color="#8D91A3" />
              <Text style={styles.juzFooterHintText}>
                Select a Surah to open its Ayahs.
              </Text>
            </View>
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

          <View style={styles.readerToolbar}>
            <View style={styles.readerToolbarTitle}>
              <Ionicons name="book-outline" size={16} color="#D8B36A" />
              <Text style={styles.readerToolbarText}>
                {readingSettings.viewMode === 'page' ? 'Page View' : 'Ayah View'}
              </Text>
            </View>
            <Pressable style={styles.fullBookButton} onPress={() => setFullQuranVisible(true)} hitSlop={8}>
              <Ionicons name="book-outline" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.readerSettingsButton}
              onPress={() => setSettingsVisible(true)}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
            </Pressable>
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
          {readingSettings.viewMode === 'page' ? (
            <View style={styles.pageView}>
              {pageGroups.length > 0 ? (
                <>
                  <View style={styles.mushafPage}>
                    <View style={styles.pageHeader}>
                      <View style={styles.pageHeaderTop}>
                        <Text style={styles.pageHeaderText}>
                          {'MUSHAF • PAGE ' + pageGroups[currentPageIndex][0]}
                        </Text>
                        <Pressable
                          style={styles.pagePlayButton}
                          onPress={playPageAudio}
                          disabled={!isPremium}
                        >
                          <Ionicons
                            name={audioStatus.playing && pageAudioEndRef.current !== null ? 'pause-circle' : 'play-circle'}
                            size={22}
                            color="#8D6B37"
                          />
                          <Text style={styles.pagePlayText}>
                            {audioStatus.playing && pageAudioEndRef.current !== null ? 'Pause' : 'Play page'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.mushafArabicBlock}>
                      {pageGroups[currentPageIndex][1].map((entry) => (
                        <View key={'page-ayah-' + entry.surahNumber + ':' + entry.ayah.number} style={[
                          styles.mushafAyahRow,
                          audioAyahIndex !== null &&
                          entry.surahNumber === currentSurah.number &&
                          currentSurah.ayahs[audioAyahIndex]?.number === entry.ayah.number &&
                          audioStatus.playing && styles.mushafAyahActive,
                        ]}>
                          <View style={styles.mushafAyahTopRow}>
                            <Text style={[styles.mushafArabicText,{fontSize:readingSettings.fontSize,lineHeight:readingSettings.lineSpacing}]}>
                              {entry.ayah.text} <Text style={styles.ayahEndMarker}>{entry.ayah.number}</Text>
                            </Text>
                            <Pressable
                              style={styles.mushafBookmarkButton}
                              onPress={() => handleBookmarkPress(entry.surahNumber, entry.ayah.number)}
                              hitSlop={8}
                            >
                              <Ionicons
                                name={bookmarkKeys.has(getBookmarkKey(entry.surahNumber, entry.ayah.number)) ? 'bookmark' : 'bookmark-outline'}
                                size={16}
                                color={bookmarkKeys.has(getBookmarkKey(currentSurah.number, ayah.number)) ? '#D8B36A' : '#8D91A3'}
                              />
                            </Pressable>
                          </View>
                          {readingSettings.showTranslation && language !== 'arabic' && (
                            <Text style={[styles.mushafTranslationText, language === 'urdu' && styles.urduTranslationText]}>
                              {getTranslation(translation,entry.surahNumber,entry.ayah.number)}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                    <View style={styles.mushafPageFooter}>
                      <Text style={styles.mushafPageFooterText}>
                        Quran • Mushaf page
                      </Text>
                      <Text style={styles.mushafPageFooterText}>
                        {pageGroups[currentPageIndex][0]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pageNavigation}>
                    <Pressable style={[styles.pageNavButton,currentPageIndex===0&&styles.pageNavDisabled]} disabled={currentPageIndex===0} onPress={() => {
                        const nextIndex = Math.max(0, currentPageIndex - 1);
                        setCurrentPageIndex(nextIndex);
                        const firstAyah = pageGroups[nextIndex]?.[1]?.[0];
                        if (firstAyah) saveQuranProgress(currentSurah.number, firstAyah.number).catch((err) => console.error('Quran page progress error:', err));
                      }}>
                      <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                      <Text style={styles.pageNavText}>Previous</Text>
                    </Pressable>
                    <Text style={styles.pageCountText}>{currentPageIndex+1} / {pageGroups.length}</Text>
                    <Pressable style={[styles.pageNavButton,currentPageIndex===pageGroups.length-1&&styles.pageNavDisabled]} disabled={currentPageIndex===pageGroups.length-1} onPress={() => {
                        const nextIndex = Math.min(pageGroups.length - 1, currentPageIndex + 1);
                        setCurrentPageIndex(nextIndex);
                        const firstAyah = pageGroups[nextIndex]?.[1]?.[0];
                        if (firstAyah) saveQuranProgress(currentSurah.number, firstAyah.number).catch((err) => console.error('Quran page progress error:', err));
                      }}>
                      <Text style={styles.pageNavText}>Next</Text>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={styles.pageLoading}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.translationLoadingText}>Preparing Mushaf page...</Text>
                </View>
              )}
            </View>
          ) : (
            currentSurah.ayahs.map(renderAyahCard)
          )}

        </ScrollView>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <Pressable style={styles.settingsBackdrop} onPress={() => setSettingsVisible(false)}>
            <Pressable style={styles.settingsSheet} onPress={() => {}}>
              <View style={styles.settingsHeader}>
                <View>
                  <Text style={styles.settingsTitle}>Reading Settings</Text>
                  <Text style={styles.settingsSubtitle}>Quiet controls • changes apply live</Text>
                </View>
                <Pressable onPress={() => setSettingsVisible(false)} style={styles.settingsClose}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              <View style={styles.settingsSection}>
                <View style={styles.settingsLabelRow}>
                  <Text style={styles.settingsLabel}>Text Size</Text>
                  <Text style={styles.settingsValue}>{readingSettings.fontSize}px</Text>
                </View>
                <View style={styles.fontSliderRow}>
                  <Text style={styles.sliderLetterSmall}>A</Text>
                  <Slider style={styles.nativeFontSlider} minimumValue={20} maximumValue={36} step={1} value={readingSettings.fontSize}
                    minimumTrackTintColor="#D8B36A" maximumTrackTintColor="#3A3F49" thumbTintColor="#FFFFFF"
                    onValueChange={(size) => updateReadingSettings({...readingSettings,fontSize:Math.round(size),lineSpacing:Math.round(size*1.92)})}
                  />
                  <Text style={styles.sliderLetterLarge}>A</Text>
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.settingsLabel}>Translation</Text>
                <View style={styles.settingsPills}>
                  {QURAN_LANGUAGES.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.settingsPill, language === item.id && styles.settingsPillActive]}
                      onPress={() => setLanguage(item.id)}
                    >
                      <Text style={[styles.settingsPillText, language === item.id && styles.settingsPillTextActive]}>
                        {item.nativeLabel}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={styles.translationToggle}
                  onPress={() =>
                    updateReadingSettings({
                      ...readingSettings,
                      showTranslation: !readingSettings.showTranslation,
                    })
                  }
                >
                  <Text style={styles.translationToggleText}>
                    {readingSettings.showTranslation ? 'Translation On' : 'Translation Off'}
                  </Text>
                  <Ionicons
                    name={readingSettings.showTranslation ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={readingSettings.showTranslation ? '#D8B36A' : '#737887'}
                  />
                </Pressable>
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.settingsLabel}>Reading Layout</Text>
                <View style={styles.settingsPills}>
                  {([
                    ['ayah', 'Ayah'],
                    ['page', 'Page'],
                  ] as Array<[QuranReaderViewMode, string]>).map(([mode, label]) => (
                    <Pressable
                      key={mode}
                      style={[styles.settingsPill, readingSettings.viewMode === mode && styles.settingsPillActive]}
                      onPress={() =>
                        updateReadingSettings({ ...readingSettings, viewMode: mode })
                      }
                    >
                      <Text style={[styles.settingsPillText, readingSettings.viewMode === mode && styles.settingsPillTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.settingsHint}>
                  Page mode follows the Mushaf page mapping; Ayah mode is the normal reader.
                </Text>
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.settingsLabel}>Audio</Text>
                <View style={styles.settingsPills}>
                  {([
                    ['ayah', 'Per Ayah'],
                    ['continuous', 'Continuous Surah'],
                  ] as Array<[QuranAudioMode, string]>).map(([mode, label]) => (
                    <Pressable
                      key={mode}
                      style={[styles.settingsPill, readingSettings.audioMode === mode && styles.settingsPillActive]}
                      onPress={() =>
                        updateReadingSettings({ ...readingSettings, audioMode: mode })
                      }
                    >
                      <Text style={[styles.settingsPillText, readingSettings.audioMode === mode && styles.settingsPillTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.settingsHint}>
                  Continuous mode moves Ayah → Ayah until the whole Surah finishes.
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={bookmarksVisible} transparent animationType="fade" onRequestClose={() => setBookmarksVisible(false)}>
          <Pressable style={styles.settingsBackdrop} onPress={() => setBookmarksVisible(false)}>
            <Pressable style={styles.settingsSheet} onPress={() => {}}>
              <View style={styles.settingsHeader}>
                <View>
                  <Text style={styles.settingsTitle}>Bookmarks</Text>
                  <Text style={styles.settingsSubtitle}>Saved Ayahs • tap to open exactly</Text>
                </View>
                <Pressable onPress={() => setBookmarksVisible(false)} style={styles.settingsClose}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
              <ScrollView style={styles.bookmarksScroll}>
                {getBookmarks().length === 0 ? <Text style={styles.emptyBookmarks}>No bookmarks yet.</Text> :
                  getBookmarks().map((bookmark) => {
                    const surah = SURAHS[bookmark.surahNumber - 1];
                    const ayah = quran.find((s) => s.number === bookmark.surahNumber)?.ayahs.find((a) => a.number === bookmark.ayahNumber);
                    return (
                      <Pressable key={bookmark.surahNumber + ':' + bookmark.ayahNumber} style={styles.bookmarkRow} onPress={() => { setBookmarksVisible(false); openExactAyah(bookmark.surahNumber, bookmark.ayahNumber); }}>
                        <View style={styles.bookmarkRowNumber}><Text style={styles.bookmarkRowNumberText}>{bookmark.surahNumber}:{bookmark.ayahNumber}</Text></View>
                        <View style={styles.bookmarkRowText}>
                          <Text style={styles.bookmarkRowTitle}>{surah?.englishName ?? 'Quran'}</Text>
                          <Text style={styles.bookmarkRowArabic} numberOfLines={1}>{ayah?.text ?? 'Saved Ayah'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#7F8492" />
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={fullQuranVisible} animationType="slide" onRequestClose={() => setFullQuranVisible(false)}>
          <View style={styles.fullQuranModal}>
            <View style={styles.fullQuranHeader}>
              <View>
                <Text style={styles.settingsTitle}>Quran Book</Text>
                <Text style={styles.settingsSubtitle}>Mushaf • page by page</Text>
              </View>
              <Pressable onPress={() => setFullQuranVisible(false)} style={styles.settingsClose}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            {fullQuranPageLoading ? (
              <View style={styles.fullQuranLoading}>
                <ActivityIndicator size="small" color="#D8B36A" />
                <Text style={styles.fullQuranLoadingText}>Preparing the Mushaf pages…</Text>
              </View>
            ) : fullQuranPageGroups.length > 0 ? (
              <View style={styles.fullQuranReader}>
                <View style={styles.mushafPage}>
                  <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderTop}>
                      <Text style={styles.pageHeaderText}>MUSHAF • PAGE {fullQuranPageGroups[fullQuranPageIndex]?.[0]}</Text>
                    </View>
                  </View>
                  <View style={styles.mushafArabicBlock}>
                    {fullQuranPageGroups[fullQuranPageIndex]?.[1].map((entry) => (
                      <Pressable key={entry.surahNumber + ':' + entry.ayah.number} onPress={() => { setFullQuranVisible(false); openExactAyah(entry.surahNumber, entry.ayah.number); }} style={styles.mushafAyahRow}>
                        <Text style={styles.mushafArabicText}>
                          {entry.ayah.text} <Text style={styles.ayahEndMarker}>{entry.ayah.number}</Text>
                        </Text>
                        {readingSettings.showTranslation && language !== 'arabic' && (
                          <Text style={[styles.mushafTranslationText, language === 'urdu' && styles.urduTranslationText]}>{getTranslation(translation, entry.surahNumber, entry.ayah.number)}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.mushafPageFooter}>
                    <Text style={styles.mushafPageFooterText}>Quran • Mushaf</Text>
                    <Text style={styles.mushafPageFooterText}>{fullQuranPageGroups[fullQuranPageIndex]?.[0]}</Text>
                  </View>
                </View>
                <View style={styles.pageNavigation}>
                  <Pressable style={styles.pageNavButton} disabled={fullQuranPageIndex === 0} onPress={() => setFullQuranPageIndex((value) => Math.max(0, value - 1))}>
                    <Ionicons name="chevron-back" size={16} color="#FFFFFF" /><Text style={styles.pageNavText}>Previous</Text>
                  </Pressable>
                  <Text style={styles.pageCountText}>{fullQuranPageIndex + 1} / {fullQuranPageGroups.length}</Text>
                  <Pressable style={styles.pageNavButton} disabled={fullQuranPageIndex >= fullQuranPageGroups.length - 1} onPress={() => setFullQuranPageIndex((value) => Math.min(fullQuranPageGroups.length - 1, value + 1))}>
                    <Text style={styles.pageNavText}>Next</Text><Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.fullQuranLoading}><Text style={styles.fullQuranLoadingText}>Mushaf pages are unavailable right now.</Text></View>
            )}
          </View>
        </Modal>
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
          onPress={() => openExactAyah(
            quranProgress?.surahNumber ?? 1,
            quranProgress?.ayahNumber ?? 1
          )}
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
              Advanced reading controls, Tafsir, Quran audio, insights and immersive Mushaf reading.
            </Text>
          </View>
        )}

        <View style={styles.compactHistoryCard}>
          <View style={styles.compactHistoryHeader}>
            <View>
              <Text style={styles.compactHistoryTitle}>Reading History</Text>
              <Text style={styles.compactHistorySubtitle}>
                {readingSummary ? readingSummary.last7Days + ' sessions in the last 7 days' : 'Your recent Quran reading'}
              </Text>
            </View>
            <Ionicons name="time-outline" size={20} color="#D8B36A" />
          </View>
          <View style={styles.historyDots}>
            {readingHistory.slice(-14).map((day) => (
              <View key={day.date} style={styles.historyDotItem}>
                <Text style={styles.historyDotCount}>{day.count || 0}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.bookmarksCard} onPress={openBookmarks}>
          <View style={styles.continueIcon}>
            <Ionicons name="bookmark" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.continueTextContainer}>
            <Text style={styles.continueLabel}>SAVED AYAHS</Text>
            <Text style={styles.continueTitle}>{bookmarkKeys.size} Bookmarks</Text>
            <Text style={styles.continueMeta}>Open an exact saved Ayah</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
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
            placeholder="Search Ayah or reference (e.g. 2:255)..."
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
          Quran Para
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

  readerToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, marginBottom: 8,
  },
  readerToolbarTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readerToolbarText: { color: '#9DA1AE', fontSize: 11, fontWeight: '800' },
  readerSettingsButton: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#151922', borderWidth: 1, borderColor: '#2A303C',
  },
  pageView: { marginTop: 12 },
  pageLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  mushafPage: {
    backgroundColor: '#F7F0E2', borderRadius: 10, paddingHorizontal: 18,
    paddingVertical: 18, marginBottom: 16, borderWidth: 1, borderColor: '#D9C9AC',
  },
  pageHeader: { marginBottom: 10 },
  pageHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageHeaderText: { color: '#8D6B37', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  mushafPageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D9C9AC',
  },
  mushafPageFooterText: { color: '#8D6B37', fontSize: 8, fontWeight: '800' },
  mushafArabicBlock: { alignItems: 'stretch' },
  pageTranslationBlock: { marginTop: 8 },
  mushafArabicText: {
    color: '#17130E', textAlign: 'right', writingDirection: 'rtl',
    fontWeight: '500', marginBottom: 6,
  },
  mushafTranslationText: {
    color: '#5B554C', fontSize: 14, lineHeight: 22, marginBottom: 12,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#DED3C2',
  },
  urduTranslationText: { textAlign: 'right', writingDirection: 'rtl', fontSize: 16, lineHeight: 28 },
  settingsBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end', padding: 12,
  },
  settingsSheet: { maxWidth:420, maxHeight:'72%', alignSelf:'center', width:'92%', marginTop:'auto', marginBottom:'auto',
    backgroundColor: '#11141B', borderRadius: 24, padding: 16,
    borderWidth: 1, borderColor: '#2A303C', maxHeight: '82%',
  },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingsTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  settingsSubtitle: { color: '#777D8B', fontSize: 10, marginTop: 3 },
  settingsClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1E27' },
  settingsSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222833' },
  settingsLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  settingsValue: { color: '#D8B36A', fontSize: 11, fontWeight: '900' },
  fontSliderRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  nativeFontSlider: { flex: 1, height: 34 },
  sliderLetterSmall: { color: '#8D91A3', fontSize: 12, fontWeight: '800' },
  sliderLetterLarge: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  fontSlider: { flex: 1, height: 5, borderRadius: 5, backgroundColor: '#2B303A', position: 'relative' },
  fontSliderFill: { height: 5, borderRadius: 5, backgroundColor: '#D8B36A' },
  fontSliderThumb: {
    position: 'absolute', top: -5, width: 15, height: 15, marginLeft: -7,
    borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D8B36A',
  },
  sliderTouchRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -12, height: 30 },
  sliderTouch: { flex: 1 },
  settingsPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  settingsPill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: '#181C24', borderWidth: 1, borderColor: '#2B303B' },
  settingsPillActive: { backgroundColor: '#211F18', borderColor: '#806B3D' },
  settingsPillText: { color: '#8E93A1', fontSize: 10, fontWeight: '800' },
  settingsPillTextActive: { color: '#D8B36A' },
  translationToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, padding: 9, borderRadius: 11, backgroundColor: '#171B23' },
  translationToggleText: { color: '#C6CAD3', fontSize: 10, fontWeight: '700' },
  settingsHint: { color: '#6F7482', fontSize: 9, lineHeight: 14, marginTop: 7 },
  juzFooterHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  juzFooterHintText: { color: '#777D8B', fontSize: 10 },
  compactHistoryCard: { backgroundColor:'#11141B', borderRadius:18, padding:14, marginBottom:12, borderWidth:1, borderColor:'#252A36' },
  compactHistoryHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  compactHistoryTitle: { color:'#FFFFFF', fontSize:15, fontWeight:'800' },
  compactHistorySubtitle: { color:'#777B8A', fontSize:11, marginTop:3 },
  historyDots: { flexDirection:'row', gap:5, marginTop:12 },
  historyDotItem: { minWidth:22, height:22, borderRadius:7, backgroundColor:'#1C2029', alignItems:'center', justifyContent:'center' },
  historyDotCount: { color:'#D8B36A', fontSize:9, fontWeight:'800' },
  bookmarksCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#11141B', borderRadius:19, padding:14, marginBottom:4, borderWidth:1, borderColor:'#252A36' },
  pagePlayButton: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:9, paddingVertical:6, borderRadius:10, backgroundColor:'#211F18' },
  pagePlayText: { color:'#D8B36A', fontSize:10, fontWeight:'800' },
  mushafAyahRow: { paddingVertical:6, borderBottomWidth:1, borderBottomColor:'#29251F' },
  mushafAyahTopRow: { flexDirection:'row', alignItems:'flex-start', gap:8 },
  mushafBookmarkButton: { width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center', marginTop:2 },
  mushafAyahActive: { backgroundColor:'#211F18', borderRadius:8, paddingHorizontal:8 },
  ayahEndMarker: { color:'#D8B36A', fontSize:13 },
  pageNavigation: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:10 },
  pageNavButton: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:9, borderRadius:12, backgroundColor:'#151922' },
  pageNavDisabled: { opacity:0.35 },
  pageNavText: { color:'#FFFFFF', fontSize:11, fontWeight:'700' },
  pageCountText: { color:'#8D91A3', fontSize:11, fontWeight:'700' },
  fullBookButton: { width:38, height:38, borderRadius:12, backgroundColor:'#151922', alignItems:'center', justifyContent:'center', marginRight:6 },
  bookmarksScroll: { maxHeight:520 },
  emptyBookmarks: { color:'#8D91A3', textAlign:'center', paddingVertical:30 },
  bookmarkRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:11, borderBottomWidth:1, borderBottomColor:'#252A36' },
  bookmarkRowNumber: { width:48, height:38, borderRadius:10, backgroundColor:'#1C2029', alignItems:'center', justifyContent:'center' },
  bookmarkRowNumberText: { color:'#D8B36A', fontSize:10, fontWeight:'900' },
  bookmarkRowText: { flex:1 },
  bookmarkRowTitle: { color:'#FFFFFF', fontSize:13, fontWeight:'800' },
  bookmarkRowArabic: { color:'#A9ADB8', fontSize:15, textAlign:'right', writingDirection:'rtl', marginTop:3 },
  fullQuranModal: { flex:1, backgroundColor:'#080A0F' },
  fullQuranHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingTop:18, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'#252A36' },
  fullQuranLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  fullQuranLoadingText: { color: '#8D91A3', fontSize: 13 },
  fullQuranReader: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  fullQuranContent: { padding:18, paddingBottom:50 },
  fullQuranSurah: { marginBottom:24, backgroundColor:'#10131A', borderRadius:18, padding:15, borderWidth:1, borderColor:'#252A36' },
  fullQuranSurahHeader: { alignItems:'center', paddingBottom:12, marginBottom:10, borderBottomWidth:1, borderBottomColor:'#252A36' },
  fullQuranSurahName: { color:'#F2EBDD', fontSize:23, fontWeight:'800' },
  fullQuranSurahEnglish: { color:'#8D91A3', fontSize:11, marginTop:4 },
  fullQuranArabic: { color:'#F2EBDD', fontSize:24, lineHeight:46, textAlign:'right', writingDirection:'rtl', paddingVertical:4 },
  fullQuranTranslation: { color:'#BFC3CD', fontSize:14, lineHeight:23, paddingBottom:8 },
  compactHistoryItem: { width: 48, minHeight: 48, borderRadius: 12, backgroundColor: '#151922', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#252A35' },

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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
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
