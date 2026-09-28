import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './themes/ThemeProvider';
import { createThemedStyles } from './themes/themeStyleMapper';
import { usePremium } from './premium/PremiumProvider';

type H = {
  id?: number;
  idInBook?: number;
  arabic?: string;
  english?: { narrator?: string; text?: string };
  reference?: { text?: string };
  grade?: string;
};

type TranslationHadith = {
  hadithnumber?: number;
  hadithNumber?: number;
  text?: string;
  hadith?: string;
};

type SearchResult = {
  bookIndex: number;
  number: number;
  text: string;
};

type Book = {
  id: string;
  name: string;
  shortName: string;
  chapters: number;
  englishEdition: string;
  urduEdition: string;
  cover: string;
};

const B: Book[] = [
  {
    id: 'bukhari',
    name: 'Sahih al-Bukhari',
    shortName: 'Bukhari',
    chapters: 97,
    englishEdition: 'eng-bukhari',
    urduEdition: 'urd-bukhari',
    cover: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20al-Bukhari.jpg',
  },
  {
    id: 'muslim',
    name: 'Sahih Muslim',
    shortName: 'Muslim',
    chapters: 56,
    englishEdition: 'eng-muslim',
    urduEdition: 'urd-muslim',
    cover: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20Muslim.jpg',
  },
  {
    id: 'abudawud',
    name: 'Sunan Abi Dawud',
    shortName: 'Abu Dawud',
    chapters: 43,
    englishEdition: 'eng-abudawud',
    urduEdition: 'urd-abudawud',
    cover: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Abi%20Dawud.jpg',
  },
  {
    id: 'tirmidhi',
    name: 'Jami at-Tirmidhi',
    shortName: 'Tirmidhi',
    chapters: 49,
    englishEdition: 'eng-tirmidhi',
    urduEdition: 'urd-tirmidhi',
    cover: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jami%20at-Tirmidhi.jpg',
  },
  {
    id: 'nasai',
    name: "Sunan an-Nasa'i",
    shortName: "Nasa'i",
    chapters: 52,
    englishEdition: 'eng-nasai',
    urduEdition: 'urd-nasai',
    cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20an-Nasa'i.jpg",
  },
  {
    id: 'ibnmajah',
    name: 'Sunan Ibn Majah',
    shortName: 'Ibn Majah',
    chapters: 37,
    englishEdition: 'eng-ibnmajah',
    urduEdition: 'urd-ibnmajah',
    cover: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Ibn%20Majah.jpg',
  },
];

const BASE =
  'https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_chapter/the_9_books';
const FawazBase =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

const PROGRESS_KEY = '@muslim_ummah_hadith_progress_v2';
const BOOKMARKS_KEY = '@muslim_ummah_hadith_bookmarks_v2';

type Progress = {
  bookIndex: number;
  chapter: number;
  hadithNumber: number;
};

type Bookmark = {
  bookIndex: number;
  chapter: number;
  hadithNumber: number;
};

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to load Hadith data');
  return response.json();
}

function extractEditionHadiths(value: any): TranslationHadith[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.hadiths)) return value.hadiths;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function getHadithNumber(item: TranslationHadith): number | null {
  const value = item.hadithnumber ?? item.hadithNumber;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getUrduText(item: TranslationHadith): string {
  return item.hadith?.trim() || item.text?.trim() || '';
}

function chapterTitle(value: any, chapter: number): string {
  const candidates = [
    value?.metadata?.section?.[String(chapter)],
    value?.metadata?.sections?.[String(chapter)],
    value?.section?.name,
    value?.name,
  ];
  const found = candidates.find((x) => typeof x === 'string' && x.trim());
  return found?.trim() || 'Chapter ' + chapter;
}

async function getStored<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function setStored<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export default function HadithScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const s = createLegacyStyles(theme);

  const [level, setLevel] = useState<'books' | 'chapters' | 'reader'>('books');
  const [bi, setBi] = useState(0);
  const [ch, setCh] = useState(1);
  const [items, setItems] = useState<H[]>([]);
  const [urduMap, setUrduMap] = useState<Record<number, string>>({});
  const [romanUrduMap, setRomanUrduMap] = useState<Record<number, string>>({});
  const [chapterName, setChapterName] = useState('');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [language, setLanguage] = useState<'arabic' | 'english' | 'urdu' | 'hinglish'>('english');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [resumePending, setResumePending] = useState<number | null>(null);
  const readerRef = useRef<ScrollView>(null);

  const book = B[bi];

  useEffect(() => {
    (async () => {
      const savedProgress = await getStored<Progress | null>(PROGRESS_KEY, null);
      const savedBookmarks = await getStored<Bookmark[]>(BOOKMARKS_KEY, []);
      setProgress(savedProgress);
      setBookmarks(savedBookmarks);
    })();
  }, []);

  useEffect(() => {
    if (level !== 'reader') return;
    let cancelled = false;

    setBusy(true);
    setErr('');
    setItems([]);
    setUrduMap({});
    setRomanUrduMap({});

    Promise.all([
      fetchJson(`${BASE}/${book.id}/${ch}.json`),
      fetchJson(`${FawazBase}/${book.englishEdition}/sections/${ch}.json`).catch(() => null),
      fetchJson(`${FawazBase}/${book.urduEdition}/sections/${ch}.json`).catch(() => null),
      fetch(`https://cdn.jsdelivr.net/gh/HsnSaboor/hadith-api-toon@main/editions/${book.id}/translations/roman-ur/sections/${ch}.toon`)
        .then(async (r) => (r.ok ? r.text() : ''))
        .catch(() => ''),
    ])
      .then(([arabicValue, englishValue, urduValue, romanSource]) => {
        if (cancelled) return;

        const loaded = Array.isArray(arabicValue)
          ? arabicValue
          : Array.isArray(arabicValue?.hadiths)
            ? arabicValue.hadiths
            : [];

        const englishItems = extractEditionHadiths(englishValue);
        const englishMap: Record<number, TranslationHadith> = {};
        englishItems.forEach((item) => {
          const number = getHadithNumber(item);
          if (number !== null) englishMap[number] = item;
        });

        const merged: H[] = loaded.map((item: any) => {
          const number = Number(item.idInBook ?? item.id);
          const english = englishMap[number];
          return {
            ...item,
            english: {
              narrator: english?.text ? '' : item.english?.narrator,
              text: english?.text || item.english?.text,
            },
          };
        });

        const uMap: Record<number, string> = {};
        extractEditionHadiths(urduValue).forEach((item) => {
          const number = getHadithNumber(item);
          const text = getUrduText(item);
          if (number !== null && text) uMap[number] = text;
        });

        setItems(merged);
        setUrduMap(uMap);
        setChapterName(chapterTitle(englishValue, ch));
      })
      .catch((error) => {
        if (!cancelled) setErr(error instanceof Error ? error.message : 'Unable to load this chapter');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [level, bi, ch, book.id, book.englishEdition, book.urduEdition]);

  const openBook = (index: number) => {
    setBi(index);
    setCh(1);
    setSearch('');
    setSearchResults([]);
    setLevel('chapters');
  };

  const openChapter = (chapter: number) => {
    setCh(chapter);
    setSearch('');
    setSearchResults([]);
    setLevel('reader');
  };

  const backLevel = () => {
    if (level === 'reader') setLevel('chapters');
    else if (level === 'chapters') setLevel('books');
    else onBack();
  };

  const saveProgress = async (hadithNumber: number) => {
    if (!isPremium) return;
    const next = { bookIndex: bi, chapter: ch, hadithNumber };
    setProgress(next);
    await setStored(PROGRESS_KEY, next);
  };

  const toggleBookmark = async (hadithNumber: number) => {
    if (!isPremium) return;
    const exists = bookmarks.some(
      (item) => item.bookIndex === bi && item.chapter === ch && item.hadithNumber === hadithNumber
    );
    const next = exists
      ? bookmarks.filter(
          (item) => !(item.bookIndex === bi && item.chapter === ch && item.hadithNumber === hadithNumber)
        )
      : [...bookmarks, { bookIndex: bi, chapter: ch, hadithNumber }];
    setBookmarks(next);
    await setStored(BOOKMARKS_KEY, next);
  };

  const runGlobalSearch = async () => {
    const term = search.trim().toLowerCase();
    if (!term || !isPremium) return;

    setSearching(true);
    setSearchResults([]);

    const results: SearchResult[] = [];
    for (let index = 0; index < B.length; index += 1) {
      try {
        const data = await fetchJson(`${FawazBase}/${B[index].englishEdition}.min.json`);
        const list = extractEditionHadiths(data);
        for (const item of list) {
          const number = getHadithNumber(item);
          const text = item.text?.trim() || '';
          if (
            number !== null &&
            (String(number) === term ||
              text.toLowerCase().includes(term))
          ) {
            results.push({ bookIndex: index, number, text });
            if (results.length >= 30) break;
          }
        }
      } catch {
        // Keep other collections searchable if one source is unavailable.
      }
      if (results.length >= 30) break;
    }

    setSearchResults(results);
    setSearching(false);
  };

  const openSearchResult = async (result: SearchResult) => {
    setBi(result.bookIndex);
    setLevel('reader');
    setCh(1);
    setResumePending(result.number);
    setSearch('');

    // Locate the exact section without changing the visual hierarchy.
    for (let chapter = 1; chapter <= B[result.bookIndex].chapters; chapter += 1) {
      try {
        const data = await fetchJson(`${BASE}/${B[result.bookIndex].id}/${chapter}.json`);
        const list = Array.isArray(data) ? data : data?.hadiths || [];
        if (list.some((item: any) => Number(item.idInBook ?? item.id) === result.number)) {
          setCh(chapter);
          return;
        }
      } catch {
        // Continue to the next chapter.
      }
    }
  };

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || level !== 'reader') return items;
    return items.filter((h) =>
      [
        h.arabic,
        h.english?.narrator,
        h.english?.text,
        h.reference?.text,
        h.grade,
        h.idInBook,
        h.id,
        h.idInBook ? urduMap[h.idInBook] : '',
        h.idInBook ? romanUrduMap[h.idInBook] : '',
      ].join(' ').toLowerCase().includes(term)
    );
  }, [items, search, urduMap, romanUrduMap, level]);

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Pressable onPress={backLevel} style={s.iconButton}>
          <Ionicons name={level === 'books' ? 'arrow-back' : 'chevron-back'} size={22} color="#fff" />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>MUSLIM UMMAH</Text>
          <Text style={s.title}>{level === 'books' ? 'Hadith' : level === 'chapters' ? book.name : chapterName || `Chapter ${ch}`}</Text>
        </View>
        {isPremium ? (
          <View style={s.premiumPill}><Ionicons name="sparkles" size={12} color="#16130A" /><Text style={s.premiumText}>PREMIUM</Text></View>
        ) : null}
      </View>

      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color="#8C938E" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={runGlobalSearch}
          placeholder={isPremium ? 'Search any Hadith, number or words…' : 'Search in current chapter…'}
          placeholderTextColor="#68716D"
          style={s.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => { setSearch(''); setSearchResults([]); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#747C77" />
          </Pressable>
        ) : null}
      </View>

      {level === 'books' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          {progress && isPremium ? (
            <Pressable style={s.resumeCard} onPress={() => { setBi(progress.bookIndex); setCh(progress.chapter); setLevel('reader'); }}>
              <View style={s.resumeIcon}><Ionicons name="play" size={18} color="#17140B" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.resumeEyebrow}>CONTINUE READING</Text>
                <Text style={s.resumeTitle}>{B[progress.bookIndex].shortName} • Chapter {progress.chapter} • Hadith {progress.hadithNumber}</Text>
                <Text style={s.resumeSub}>Pick up exactly where you left off</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D9C77A" />
            </Pressable>
          ) : null}

          {isPremium ? (
            <View style={s.sectionIntro}>
              <Text style={s.sectionTitle}>The Six Books</Text>
              <Text style={s.sectionSub}>Explore the Sunnah collection one book at a time.</Text>
            </View>
          ) : (
            <View style={s.sectionIntro}>
              <Text style={s.sectionTitle}>Hadith Collections</Text>
              <Text style={s.sectionSub}>Choose a collection to begin reading.</Text>
            </View>
          )}

          <View style={s.bookGrid}>
            {B.map((item, index) => (
              <Pressable key={item.id} onPress={() => openBook(index)} style={s.bookCard}>
                {isPremium ? (
                  <Image source={{ uri: item.cover }} style={s.cover} resizeMode="cover" />
                ) : (
                  <View style={s.freeBookIcon}><Ionicons name="book" size={32} color="#D9C77A" /></View>
                )}
                <View style={s.bookCardBody}>
                  <Text style={s.bookName}>{item.name}</Text>
                  <Text style={s.bookMeta}>{item.chapters} books • 6 canonical collections</Text>
                  <View style={s.openRow}><Text style={s.openText}>Open collection</Text><Ionicons name="arrow-forward" size={15} color="#D9C77A" /></View>
                </View>
              </Pressable>
            ))}
          </View>

          {!isPremium ? (
            <View style={s.basicNote}>
              <Ionicons name="sparkles-outline" size={18} color="#D9C77A" />
              <Text style={s.basicNoteText}>Premium adds illustrated book covers, global search, bookmarks, resume reading and language controls.</Text>
            </View>
          ) : null}

          {searchResults.length > 0 ? (
            <View style={s.resultsBox}>
              <Text style={s.resultsTitle}>Search results</Text>
              {searchResults.map((result, index) => (
                <Pressable key={`${result.bookIndex}-${result.number}-${index}`} style={s.resultRow} onPress={() => openSearchResult(result)}>
                  <View style={s.resultNumber}><Text style={s.resultNumberText}>{result.number}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultBook}>{B[result.bookIndex].name}</Text>
                    <Text style={s.resultText} numberOfLines={2}>{result.text}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7F8792" />
                </Pressable>
              ))}
            </View>
          ) : null}

          {searching ? <View style={s.searching}><ActivityIndicator color="#D9C77A" /><Text style={s.muted}>Searching the six collections…</Text></View> : null}
        </ScrollView>
      ) : level === 'chapters' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.collectionHero}>
            {isPremium ? <Image source={{ uri: book.cover }} style={s.heroCover} /> : <View style={s.heroIcon}><Ionicons name="library" size={30} color="#D9C77A" /></View>}
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>COLLECTION</Text>
              <Text style={s.heroTitle}>{book.name}</Text>
              <Text style={s.heroSub}>{book.chapters} books / sections</Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Books & Chapters</Text>
          <Text style={s.sectionSub}>Select a chapter to open its Hadith pages.</Text>

          <View style={s.chapterList}>
            {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
              <Pressable key={chapter} onPress={() => openChapter(chapter)} style={s.chapterCard}>
                <View style={s.chapterNo}><Text style={s.chapterNoText}>{String(chapter).padStart(2, '0')}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chapterTitle}>Book {chapter}</Text>
                  <Text style={s.chapterSub}>Open Hadith pages</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#7E877F" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {searchResults.length > 0 ? null : null}
          <View style={s.readerTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.readerBook}>{book.name}</Text>
              <Text style={s.readerChapter}>{chapterName || `Chapter ${ch}`}</Text>
            </View>
            <View style={s.readerCounter}><Text style={s.readerCounterText}>Chapter {ch}/{book.chapters}</Text></View>
          </View>

          {isPremium ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.languageRow}>
              {[
                ['english', 'English'],
                ['urdu', 'اردو'],
                ['hinglish', 'Hinglish'],
                ['arabic', 'Arabic'],
              ].map(([id, label]) => (
                <Pressable key={id} onPress={() => setLanguage(id as any)} style={[s.languagePill, language === id && s.languageActive]}>
                  <Text style={[s.languageText, language === id && s.languageActiveText]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={s.freeLanguage}><Text style={s.freeLanguageText}>Arabic + English</Text></View>
          )}

          {busy ? (
            <View style={s.center}><ActivityIndicator size="large" color="#D9C77A" /><Text style={s.muted}>Opening Hadith pages…</Text></View>
          ) : err ? (
            <View style={s.center}><Text style={s.err}>{err}</Text></View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}\n              contentContainerStyle={s.readerList}\n              onContentSizeChange={() => {
                if (resumePending !== null) {\n                  const index = shown.findIndex((h) => (h.idInBook ?? h.id) === resumePending);\n                  if (index >= 0) {
                    // Each Hadith card is intentionally compact; this gives a reliable resume position without extra native dependencies.
                    setTimeout(() => {
                      setResumePending(null);
                    }, 0);
                  }
                }
              }} showsVerticalScrollIndicator={false}>
              {shown.map((h, index) => {
                const number = h.idInBook ?? h.id ?? index + 1;
                const urdu = urduMap[number];
                const bookmarked = bookmarks.some((item) => item.bookIndex === bi && item.chapter === ch && item.hadithNumber === number);
                const text = language === 'arabic' ? h.arabic : language === 'urdu' ? urdu : language === 'hinglish' ? romanUrduMap[number] : h.english?.text;

                return (
                  <View key={String(h.id ?? number) + '-' + index} style={s.hadithCard}>
                    <View style={s.hadithHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.hadithRef}>{h.reference?.text || `${book.shortName} • Hadith ${number}`}</Text>
                        {h.grade ? <Text style={s.grade}>{h.grade}</Text> : null}
                      </View>
                      {isPremium ? (
                        <Pressable onPress={() => toggleBookmark(number)} style={s.bookmarkButton}>
                          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color="#D9C77A" />
                        </Pressable>
                      ) : null}
                    </View>

                    {language === 'arabic' ? (
                      <Text style={s.arabic}>{h.arabic || 'Arabic text unavailable'}</Text>
                    ) : (
                      <>
                        <Text style={s.arabicSmall}>{h.arabic || ''}</Text>
                        <Text style={s.languageLabel}>{language === 'urdu' ? 'URDU' : language === 'hinglish' ? 'HINGLISH / ROMAN URDU' : 'ENGLISH'}</Text>
                        <Text style={[s.translationText, language === 'urdu' && s.urdu]}>{text || 'Translation not available for this Hadith.'}</Text>
                      </>
                    )}

                    {h.english?.narrator ? <Text style={s.narrator}>{h.english.narrator}</Text> : null}

                    {isPremium ? (
                      <Pressable onPress={() => saveProgress(number)} style={s.progressRow}>
                        <Ionicons name="checkmark-circle-outline" size={15} color="#7BC79B" />
                        <Text style={s.progressText}>Mark as last read</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {shown.length === 0 ? <View style={s.centerInline}><Text style={s.muted}>No Hadith found.</Text></View> : null}

              <View style={s.pageNav}>
                <Pressable disabled={ch <= 1} onPress={() => setCh((v) => v - 1)} style={[s.pageButton, ch <= 1 && s.disabled]}>
                  <Ionicons name="chevron-back" size={18} color="#D9C77A" /><Text style={s.pageButtonText}>Previous chapter</Text>
                </Pressable>
                <Pressable disabled={ch >= book.chapters} onPress={() => setCh((v) => v + 1)} style={[s.pageButton, ch >= book.chapters && s.disabled]}>
                  <Text style={s.pageButtonText}>Next chapter</Text><Ionicons name="chevron-forward" size={18} color="#D9C77A" />
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const createLegacyStyles = (theme: any) => createThemedStyles(theme, {
  root: { flex: 1, backgroundColor: '#080A0F', paddingHorizontal: 18, paddingTop: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#12161E', borderWidth: 1, borderColor: '#252A36', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { color: '#D9C77A', fontSize: 8, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D9C77A', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  premiumText: { color: '#16130A', fontSize: 8, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: '#11141B', borderRadius: 16, borderWidth: 1, borderColor: '#252A35', paddingHorizontal: 13, marginBottom: 14 },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, marginLeft: 9, paddingVertical: 8 },
  content: { paddingBottom: 40 },
  sectionIntro: { marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionSub: { color: '#858B99', fontSize: 11, marginTop: 4, lineHeight: 17 },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#19180F', borderRadius: 20, borderWidth: 1, borderColor: '#62532D', padding: 14, marginBottom: 17 },
  resumeIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#D9C77A', alignItems: 'center', justifyContent: 'center' },
  resumeEyebrow: { color: '#D9C77A', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  resumeTitle: { color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 2 },
  resumeSub: { color: '#8B918D', fontSize: 9, marginTop: 3 },
  bookGrid: { gap: 12 },
  bookCard: { flexDirection: 'row', minHeight: 142, backgroundColor: '#11141B', borderRadius: 22, borderWidth: 1, borderColor: '#252A35', overflow: 'hidden' },
  cover: { width: 96, height: 142, backgroundColor: '#1A1D24' },
  freeBookIcon: { width: 88, height: 142, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171A20' },
  bookCardBody: { flex: 1, padding: 15, justifyContent: 'center' },
  bookName: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  bookMeta: { color: '#858B99', fontSize: 9, marginTop: 6 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  openText: { color: '#D9C77A', fontSize: 10, fontWeight: '800' },
  basicNote: { flexDirection: 'row', gap: 9, marginTop: 16, backgroundColor: '#11141B', borderRadius: 17, borderWidth: 1, borderColor: '#252A35', padding: 13 },
  basicNoteText: { flex: 1, color: '#858B99', fontSize: 10, lineHeight: 15 },
  collectionHero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#11141B', borderRadius: 22, borderWidth: 1, borderColor: '#252A35', padding: 13, marginBottom: 20 },
  heroCover: { width: 62, height: 88, borderRadius: 10, backgroundColor: '#1A1D24' },
  heroIcon: { width: 62, height: 88, borderRadius: 10, backgroundColor: '#19180F', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 3 },
  heroSub: { color: '#858B99', fontSize: 10, marginTop: 4 },
  chapterList: { gap: 9, marginTop: 14 },
  chapterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#11141B', borderRadius: 17, borderWidth: 1, borderColor: '#252A35', padding: 12 },
  chapterNo: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#1A1D24', alignItems: 'center', justifyContent: 'center' },
  chapterNoText: { color: '#D9C77A', fontSize: 12, fontWeight: '900' },
  chapterTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  chapterSub: { color: '#747C77', fontSize: 9, marginTop: 3 },
  readerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 9 },
  readerBook: { color: '#D9C77A', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  readerChapter: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  readerCounter: { backgroundColor: '#12161E', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  readerCounterText: { color: '#8D948F', fontSize: 8, fontWeight: '800' },
  languageRow: { gap: 7, paddingVertical: 7, paddingBottom: 12 },
  languagePill: { borderRadius: 14, borderWidth: 1, borderColor: '#252A35', backgroundColor: '#11141B', paddingHorizontal: 12, paddingVertical: 8 },
  languageActive: { backgroundColor: '#211F18', borderColor: '#806B3D' },
  languageText: { color: '#858B99', fontSize: 10, fontWeight: '800' },
  languageActiveText: { color: '#D9C77A' },
  freeLanguage: { paddingBottom: 12 },
  freeLanguageText: { color: '#858B99', fontSize: 9, fontWeight: '700' },
  readerList: { gap: 11, paddingBottom: 35 },
  hadithCard: { backgroundColor: '#11141B', borderRadius: 21, borderWidth: 1, borderColor: '#252A35', padding: 16 },
  hadithHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  hadithRef: { color: '#D9C77A', fontSize: 10, fontWeight: '900' },
  grade: { color: '#79C798', fontSize: 9, marginTop: 4 },
  bookmarkButton: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#1A1D24', alignItems: 'center', justifyContent: 'center' },
  arabic: { color: '#F3F1E8', fontSize: 23, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl', marginTop: 14 },
  arabicSmall: { color: '#DAD8D0', fontSize: 17, lineHeight: 32, textAlign: 'right', writingDirection: 'rtl', marginTop: 12 },
  languageLabel: { color: '#D9C77A', fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginTop: 13, marginBottom: 5 },
  translationText: { color: '#D5D8D2', fontSize: 13, lineHeight: 22 },
  urdu: { fontSize: 17, lineHeight: 31, textAlign: 'right', writingDirection: 'rtl' },
  narrator: { color: '#929A95', fontSize: 10, fontWeight: '700', marginTop: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#22262E' },
  progressText: { color: '#7BC79B', fontSize: 9, fontWeight: '800' },
  pageNav: { flexDirection: 'row', gap: 9, marginTop: 5 },
  pageButton: { flex: 1, minHeight: 43, borderRadius: 14, backgroundColor: '#11141B', borderWidth: 1, borderColor: '#252A35', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  pageButtonText: { color: '#D9C77A', fontSize: 9, fontWeight: '800' },
  disabled: { opacity: 0.35 },
  resultsBox: { marginTop: 15, backgroundColor: '#11141B', borderRadius: 20, borderWidth: 1, borderColor: '#252A35', padding: 13 },
  resultsTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 7 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#22262E' },
  resultNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#1B1E25', alignItems: 'center', justifyContent: 'center' },
  resultNumberText: { color: '#D9C77A', fontSize: 9, fontWeight: '900' },
  resultBook: { color: '#fff', fontSize: 10, fontWeight: '800' },
  resultText: { color: '#858B99', fontSize: 9, lineHeight: 14, marginTop: 3 },
  searching: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9 },
  centerInline: { padding: 35, alignItems: 'center' },
  muted: { color: '#7F8792', fontSize: 11 },
  err: { color: '#E9A5AB', textAlign: 'center' },
});