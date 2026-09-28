import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './themes/ThemeProvider';
import { createThemedStyles } from './themes/themeStyleMapper';
import { usePremium } from './premium/PremiumProvider';

type Hadith = { id?: number; idInBook?: number; arabic?: string; english?: { narrator?: string; text?: string }; reference?: { text?: string }; grade?: string; chapterIntro?: string };
type TranslationHadith = { hadithnumber?: number; hadithNumber?: number; text?: string; hadith?: string };
type CollectionBook = { id: number; name: string };
type HadithChapter = { key: string; title: string; hadithNumbers: number[] };
type SearchResult = { bookIndex: number; number: number; text: string };
type Book = { id: string; name: string; shortName: string; chapters: number; englishEdition: string; urduEdition: string; cover: string };

const B: Book[] = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', shortName: 'Bukhari', chapters: 97, englishEdition: 'eng-bukhari', urduEdition: 'urd-bukhari', cover: './hadith-covers/bukhari.jpg' },
  { id: 'muslim', name: 'Sahih Muslim', shortName: 'Muslim', chapters: 56, englishEdition: 'eng-muslim', urduEdition: 'urd-muslim', cover: './hadith-covers/muslim.jpg' },
  { id: 'abudawud', name: 'Sunan Abi Dawud', shortName: 'Abu Dawud', chapters: 43, englishEdition: 'eng-abudawud', urduEdition: 'urd-abudawud', cover: './hadith-covers/abudawud.jpg' },
  { id: 'tirmidhi', name: 'Jami at-Tirmidhi', shortName: 'Tirmidhi', chapters: 49, englishEdition: 'eng-tirmidhi', urduEdition: 'urd-tirmidhi', cover: './hadith-covers/tirmidhi.jpg' },
  { id: 'nasai', name: "Sunan an-Nasa'i", shortName: "Nasa'i", chapters: 52, englishEdition: 'eng-nasai', urduEdition: 'urd-nasai', cover: './hadith-covers/nasai.jpg' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', shortName: 'Ibn Majah', chapters: 37, englishEdition: 'eng-ibnmajah', urduEdition: 'urd-ibnmajah', cover: './hadith-covers/ibnmajah.jpg' },
];

const BASE = './offline-hadith/ahmed';
const FAWAZ = './offline-hadith/fawaz';
const TOON = './offline-hadith/toon';
const PROGRESS_KEY = '@muslim_ummah_hadith_progress_v2';
const BOOKMARKS_KEY = '@muslim_ummah_hadith_bookmarks_v2';

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to load Hadith data');
  return response.json();
}
function extractHadiths(value: any): TranslationHadith[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.hadiths)) return value.hadiths;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}
function hadithNumber(item: TranslationHadith): number | null {
  const n = Number(item.hadithnumber ?? item.hadithNumber);
  return Number.isFinite(n) ? n : null;
}
function urduText(item: TranslationHadith): string { return item.hadith?.trim() || item.text?.trim() || ''; }
function parseCsvLine(line: string): string[] {
  const values: string[] = []; let current = ''; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { values.push(current); current = ''; }
    else current += ch;
  }
  values.push(current); return values;
}
function parseToonRows(source: string): Record<string, string>[] {
  const match = source.match(/^[A-Za-z_]+\[(?:count|\d+)\]\{([^}]+)\}:\s*/m);
  if (!match || match.index === undefined) return [];
  const columns = match[1].split(',').map((x) => x.trim());
  const body = source.slice(match.index + match[0].length);
  const rows: Record<string, string>[] = []; let current = ''; let quoted = false;
  body.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    current += (current ? '\\n' : '') + line;
    const quoteCount = (line.replace(/""/g, '').match(/"/g) || []).length;
    if (quoteCount % 2 === 1) quoted = !quoted;
    if (!quoted) {
      const values = parseCsvLine(current); const row: Record<string, string> = {};
      columns.forEach((column, index) => { row[column] = values[index] || ''; });
      rows.push(row); current = '';
    }
  });
  return rows;
}
function editionSections(value: any): CollectionBook[] {
  const raw = value?.metadata?.sections ?? value?.metadata?.section ?? {};
  if (Array.isArray(raw)) return raw.map((name: any, i: number) => ({ id: i + 1, name: String(name) }));
  return Object.entries(raw).map(([id, name]) => ({ id: Number(id), name: String(name) })).filter((x) => Number.isFinite(x.id) && x.name.trim());
}

export default function HadithScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme(); const { isPremium } = usePremium(); const s = createLegacyStyles(theme);
  const [level, setLevel] = useState<'collections' | 'books' | 'chapters' | 'reader'>('collections');
  const [bi, setBi] = useState(0); const [bookNo, setBookNo] = useState(1); const [chapterKey, setChapterKey] = useState('');
  const [items, setItems] = useState<Hadith[]>([]); const [chapters, setChapters] = useState<HadithChapter[]>([]); const [books, setBooks] = useState<CollectionBook[]>([]);
  const [urduMap, setUrduMap] = useState<Record<number, string>>({}); const [hindiMap, setHindiMap] = useState<Record<number, string>>({}); const [romanMap, setRomanMap] = useState<Record<number, string>>({});
  const [chapterName, setChapterName] = useState(''); const [search, setSearch] = useState(''); const [searchResults, setSearchResults] = useState<SearchResult[]>([]); const [searching, setSearching] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [language, setLanguage] = useState<'english' | 'urdu' | 'hindi' | 'hinglish'>('english');
  const [bookmarks, setBookmarks] = useState<{ bookIndex: number; chapter: number; hadithNumber: number }[]>([]);
  const book = B[bi];

  useEffect(() => { (async () => { setBookmarks(await getStored(BOOKMARKS_KEY, [])); })(); }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (level === 'reader') {
        setLevel('chapters');
        return true;
      }
      if (level === 'chapters') {
        setLevel('books');
        return true;
      }
      if (level === 'books') {
        setLevel('collections');
        return true;
      }
      onBack();
      return true;
    });
    return () => handler.remove();
  }, [level, onBack]);



  useEffect(() => {
    if (level !== 'chapters' && level !== 'reader') return;
    let cancelled = false; setBusy(true); setErr('');
    Promise.all([
      fetchJson(BASE + '/' + book.id + '/' + bookNo + '.json'),
      fetchJson(FAWAZ + '/' + book.englishEdition + '/sections/' + bookNo + '.json').catch(() => null),
      fetchJson(FAWAZ + '/' + book.urduEdition + '/sections/' + bookNo + '.json').catch(() => null),
      fetch(TOON + '/' + book.id + '/sections/' + bookNo + '.toon').then((r) => r.ok ? r.text() : '').catch(() => ''),
      fetch(TOON + '/' + book.id + '/translations/hi/sections/' + bookNo + '.toon').then((r) => r.ok ? r.text() : '').catch(() => ''),
      fetch(TOON + '/' + book.id + '/translations/roman-ur/sections/' + bookNo + '.toon').then((r) => r.ok ? r.text() : '').catch(() => ''),
    ]).then(([arabicValue, englishValue, urduValue, sectionToon, hindiToon, romanToon]) => {
      if (cancelled) return;
      const source = Array.isArray(arabicValue) ? arabicValue : arabicValue?.hadiths || [];
      const enMap: Record<number, TranslationHadith> = {};
      extractHadiths(englishValue).forEach((item) => { const n = hadithNumber(item); if (n !== null) enMap[n] = item; });
      const uMap: Record<number, string> = {};
      extractHadiths(urduValue).forEach((item) => { const n = hadithNumber(item); const text = urduText(item); if (n !== null && text) uMap[n] = text; });
      const hMap: Record<number, string> = {}; parseToonRows(hindiToon).forEach((row) => { const n = Number(row.hadithnumber); if (Number.isFinite(n) && row.text?.trim()) hMap[n] = row.text.trim(); });
      const rMap: Record<number, string> = {}; parseToonRows(romanToon).forEach((row) => { const n = Number(row.hadithnumber); if (Number.isFinite(n) && row.text?.trim()) rMap[n] = row.text.trim(); });
      const toonRows = parseToonRows(sectionToon);
      // Build a reliable hadith-number -> chapter-title map from the TOON source.
      // chapter_intro is present on the first hadith of each chapter; carry that
      // title forward until the next chapter marker.
      const chapterTitleByNumber: Record<number, string> = {};
      const orderedChapterTitles: { title: string; hadithNumbers: number[] }[] = [];
      let activeChapter = '';
      toonRows.forEach((row) => {
        const n = Number(row.hadithnumber);
        if (!Number.isFinite(n)) return;
        const intro = row.chapter_intro?.trim();
        if (intro) {
          activeChapter = intro;
          if (!orderedChapterTitles.some((x) => x.title.toLowerCase() === activeChapter.toLowerCase())) {
            orderedChapterTitles.push({ title: activeChapter, hadithNumbers: [] });
          }
        }
        if (activeChapter) {
          chapterTitleByNumber[n] = activeChapter;
          const target = orderedChapterTitles.find((x) => x.title.toLowerCase() === activeChapter.toLowerCase());
          if (target && !target.hadithNumbers.includes(n)) target.hadithNumbers.push(n);
        }
      });

      // Fallback to chapterId when TOON chapter markers are unavailable.
      const chapterMap = new Map<string, HadithChapter>();
      source.forEach((item: any) => {
        const n = Number(item.idInBook ?? item.id);
        if (!Number.isFinite(n)) return;
        const chapterId = Number(item.chapterId);
        const title = chapterTitleByNumber[n] || (Number.isFinite(chapterId) ? 'Chapter ' + chapterId : 'Chapter');
        const key = title.toLowerCase();
        const existing = chapterMap.get(key);
        if (existing) existing.hadithNumbers.push(n);
        else chapterMap.set(key, { key, title, hadithNumbers: [n] });
      });
      orderedChapterTitles.forEach((chapter) => {
        const key = chapter.title.toLowerCase();
        if (!chapterMap.has(key)) chapterMap.set(key, { key, title: chapter.title, hadithNumbers: chapter.hadithNumbers });
      });

      const merged: Hadith[] = source.map((item: any) => {
        const n = Number(item.idInBook ?? item.id);
        const en = enMap[n];
        const chapterId = Number(item.chapterId);
        const chapterIntro = chapterTitleByNumber[n] || (Number.isFinite(chapterId) ? 'Chapter ' + chapterId : '');
        return { ...item, english: { narrator: en?.text ? '' : item.english?.narrator, text: en?.text || item.english?.text }, chapterIntro };
      });
      if (cancelled) return;
      setItems(merged); setChapters(Array.from(chapterMap.values())); setUrduMap(uMap); setHindiMap(hMap); setRomanMap(rMap);
      setChapterName(englishValue?.metadata?.section?.[String(bookNo)] || englishValue?.metadata?.sections?.[String(bookNo)] || 'Book ' + bookNo);
    }).catch((error) => { if (!cancelled) setErr(error instanceof Error ? error.message : 'Unable to load this book'); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [level, bi, bookNo, book.id, book.englishEdition, book.urduEdition]);

  const openCollection = async (index: number) => {
    setBi(index); setBookNo(1); setChapterKey(''); setSearch(''); setSearchResults([]); setBooks([]); setLevel('books');
    try {
      const data = await fetchJson(FAWAZ + '/' + B[index].englishEdition + '.json'); const rows = editionSections(data);
      setBooks(rows.length ? rows : Array.from({ length: B[index].chapters }, (_, i) => ({ id: i + 1, name: 'Book ' + (i + 1) })));
    } catch { setBooks(Array.from({ length: B[index].chapters }, (_, i) => ({ id: i + 1, name: 'Book ' + (i + 1) }))); }
  };
  const openBook = (number: number) => {
    setBookNo(number);
    setChapterKey('');
    setSearch('');
    setSearchResults([]);
    setChapters([]);
    setItems([]);
    setErr('');
    setLevel('chapters');
  };
  const openChapter = (key: string) => { setChapterKey(key); setSearch(''); setSearchResults([]); setLevel('reader'); };
  const backLevel = () => { if (level === 'reader') setLevel('chapters'); else if (level === 'chapters') setLevel('books'); else if (level === 'books') setLevel('collections'); else onBack(); };

  const toggleBookmark = async (number: number) => {
    if (!isPremium) return;
    const exists = bookmarks.some((x) => x.bookIndex === bi && x.chapter === bookNo && x.hadithNumber === number);
    const next = exists ? bookmarks.filter((x) => !(x.bookIndex === bi && x.chapter === bookNo && x.hadithNumber === number)) : [...bookmarks, { bookIndex: bi, chapter: bookNo, hadithNumber: number }];
    setBookmarks(next); await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  };

  const runSearch = async () => {
    const term = search.trim().toLowerCase(); if (!term) return;
    setSearching(true); const results: SearchResult[] = [];
    for (let i = 0; i < B.length && results.length < 30; i += 1) {
      try {
        const data = await fetchJson(FAWAZ + '/' + B[i].englishEdition + '.min.json');
        for (const item of extractHadiths(data)) {
          const n = hadithNumber(item); const text = item.text?.trim() || '';
          if (n !== null && (String(n) === term || text.toLowerCase().includes(term))) { results.push({ bookIndex: i, number: n, text }); if (results.length >= 30) break; }
        }
      } catch {}
    }
    setSearchResults(results); setSearching(false);
  };

  const shown = useMemo(() => {
    let list = items;
    if (level === 'reader' && chapterKey) list = list.filter((item) => (item.chapterIntro || '').trim().toLowerCase() === chapterKey);
    const term = search.trim().toLowerCase();
    if (!term || level !== 'reader') return list;
    return list.filter((h) => [h.arabic, h.english?.text, h.english?.narrator, h.reference?.text, h.grade, h.idInBook, h.id, h.chapterIntro, h.idInBook ? urduMap[h.idInBook] : '', h.idInBook ? hindiMap[h.idInBook] : '', h.idInBook ? romanMap[h.idInBook] : ''].join(' ').toLowerCase().includes(term));
  }, [items, search, level, chapterKey, urduMap, hindiMap, romanMap]);

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Pressable onPress={backLevel} style={s.iconButton}><Ionicons name={level === 'collections' ? 'arrow-back' : 'chevron-back'} size={22} color="#fff" /></Pressable>
        <View style={s.headerText}><Text style={s.eyebrow}>MUSLIM UMMAH</Text><Text style={s.title}>{level === 'collections' ? 'Hadith' : level === 'books' ? book.name : level === 'chapters' ? 'Book ' + bookNo : chapterName}</Text></View>
        {isPremium ? <View style={s.premiumPill}><Ionicons name="sparkles" size={12} color="#16130A" /><Text style={s.premiumText}>PREMIUM</Text></View> : null}
      </View>
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color="#8C938E" />
        <TextInput value={search} onChangeText={setSearch} onSubmitEditing={runSearch} placeholder="Search any Hadith, number or words…" placeholderTextColor="#68716D" style={s.searchInput} returnKeyType="search" autoCapitalize="none" autoCorrect={false} />
        {search.length > 0 ? <Pressable onPress={() => { setSearch(''); setSearchResults([]); }}><Ionicons name="close-circle" size={18} color="#747C77" /></Pressable> : null}
      </View>

      {level === 'collections' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>Hadith Collections</Text><Text style={s.sectionSub}>Choose a collection to browse Books → Chapters → Hadiths.</Text>
          <View style={s.bookGrid}>{B.map((item, index) => <Pressable key={item.id} onPress={() => openCollection(index)} style={s.bookCard}>
            <Image source={{ uri: item.cover }} style={s.cover} resizeMode="cover" />
            <View style={s.bookCardBody}><Text style={s.bookName}>{item.name}</Text><Text style={s.bookMeta}>{item.chapters} Books</Text><View style={s.openRow}><Text style={s.openText}>Open collection</Text><Ionicons name="arrow-forward" size={15} color="#D9C77A" /></View></View>
          </Pressable>)}</View>
          {searchResults.length > 0 ? <View style={s.resultsBox}><Text style={s.resultsTitle}>Search results</Text>{searchResults.map((result, index) => <Pressable key={index} style={s.resultRow} onPress={() => { setBi(result.bookIndex); setBookNo(1); setChapterKey(''); setLevel('reader'); }}><View style={s.resultNumber}><Text style={s.resultNumberText}>{result.number}</Text></View><View style={{ flex: 1 }}><Text style={s.resultBook}>{B[result.bookIndex].name}</Text><Text style={s.resultText} numberOfLines={2}>{result.text}</Text></View><Ionicons name="chevron-forward" size={18} color="#7F8792" /></Pressable>)}</View> : null}
          {searching ? <View style={s.searching}><ActivityIndicator color="#D9C77A" /><Text style={s.muted}>Searching the six collections…</Text></View> : null}
        </ScrollView>
      ) : level === 'books' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <Text style={s.sectionTitle}>Books</Text><Text style={s.sectionSub}>Select a Book to see its Chapters.</Text>
          <View style={s.chapterList}>{books.map((item) => <Pressable key={item.id} onPress={() => openBook(item.id)} style={s.chapterCard}><View style={s.chapterNo}><Text style={s.chapterNoText}>{String(item.id).padStart(2, '0')}</Text></View><View style={{ flex: 1 }}><Text style={s.chapterTitle}>{item.name}</Text><Text style={s.chapterSub}>Open chapters</Text></View><Ionicons name="chevron-forward" size={20} color="#7E877F" /></Pressable>)}</View>
          {!books.length ? <View style={s.centerInline}><ActivityIndicator color="#D9C77A" /></View> : null}
        </ScrollView>
      ) : level === 'chapters' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.collectionHero}><Image source={{ uri: book.cover }} style={s.heroCover} resizeMode="cover" /><View style={{ flex: 1 }}><Text style={s.eyebrow}>BOOK {bookNo}</Text><Text style={s.heroTitle}>{books.find((x) => x.id === bookNo)?.name || 'Book ' + bookNo}</Text><Text style={s.heroSub}>Select a chapter.</Text></View></View>
          {busy ? <View style={s.centerInline}><ActivityIndicator color="#D9C77A" /><Text style={s.muted}>Loading chapters…</Text></View> : err ? <Text style={s.err}>{err}</Text> : null}
          <View style={s.chapterList}>{chapters.map((item, index) => <Pressable key={item.key} onPress={() => openChapter(item.key)} style={s.chapterCard}><View style={s.chapterNo}><Text style={s.chapterNoText}>{String(index + 1).padStart(2, '0')}</Text></View><View style={{ flex: 1 }}><Text style={s.chapterTitle}>{item.title}</Text><Text style={s.chapterSub}>{item.hadithNumbers.length} Hadiths</Text></View><Ionicons name="chevron-forward" size={20} color="#7E877F" /></Pressable>)}</View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={s.readerTop}><View style={{ flex: 1 }}><Text style={s.readerBook}>{book.name}</Text><Text style={s.readerChapter}>{chapters.find((x) => x.key === chapterKey)?.title || chapterName}</Text></View><View style={s.readerCounter}><Text style={s.readerCounterText}>{shown.length} Hadiths</Text></View></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.languageRow}>{[['english', 'English'], ['urdu', 'اردو'], ['hindi', 'हिन्दी'], ['hinglish', 'Hinglish']].map(([id, label]) => <Pressable key={id} onPress={() => setLanguage(id as any)} style={[s.languagePill, language === id && s.languageActive]}><Text style={[s.languageText, language === id && s.languageActiveText]}>{label}</Text></Pressable>)}</ScrollView>
          {busy ? <View style={s.center}><ActivityIndicator size="large" color="#D9C77A" /><Text style={s.muted}>Opening Hadiths…</Text></View> : err ? <View style={s.center}><Text style={s.err}>{err}</Text></View> : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.readerList}>{shown.map((h, index) => {
            const number = h.idInBook ?? h.id ?? index + 1; const text = language === 'urdu' ? urduMap[number] : language === 'hindi' ? hindiMap[number] : language === 'hinglish' ? romanMap[number] : h.english?.text;
            const bookmarked = bookmarks.some((x) => x.bookIndex === bi && x.chapter === bookNo && x.hadithNumber === number);
            return <View key={String(number) + '-' + index} style={s.hadithCard}><View style={s.hadithHeader}><View style={{ flex: 1 }}><Text style={s.hadithRef}>{h.reference?.text || book.shortName + ' • Hadith ' + number}</Text>{h.grade ? <Text style={s.grade}>{h.grade}</Text> : null}</View>{isPremium ? <Pressable onPress={() => toggleBookmark(number)} style={s.bookmarkButton}><Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color="#D9C77A" /></Pressable> : null}</View><Text style={s.arabicSmall}>{h.arabic || 'Arabic text unavailable'}</Text><Text style={s.languageLabel}>{language === 'urdu' ? 'URDU' : language === 'hindi' ? 'HINDI' : language === 'hinglish' ? 'HINGLISH / ROMAN URDU' : 'ENGLISH'}</Text><Text style={[s.translationText, language === 'urdu' && s.urdu, language === 'hindi' && s.hindi]}>{text || 'Translation not available for this Hadith.'}</Text>{h.english?.narrator ? <Text style={s.narrator}>{h.english.narrator}</Text> : null}{isPremium ? <Pressable onPress={() => saveProgress(number)} style={s.progressRow}><Ionicons name="checkmark-circle-outline" size={15} color="#7BC79B" /><Text style={s.progressText}>Mark as last read</Text></Pressable> : null}</View>;
          })}{!shown.length ? <View style={s.centerInline}><Text style={s.muted}>No Hadith found.</Text></View> : null}</ScrollView>}
        </View>
      )}
    </View>
  );
}

async function getStored<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

const createLegacyStyles = (theme: any) => createThemedStyles(theme, {
  root: { flex: 1, backgroundColor: '#080A0F', paddingHorizontal: 18, paddingTop: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#12161E', borderWidth: 1, borderColor: '#252A36', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 }, eyebrow: { color: '#D9C77A', fontSize: 8, fontWeight: '900', letterSpacing: 1.8 }, title: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D9C77A', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 }, premiumText: { color: '#16130A', fontSize: 8, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: '#11141B', borderRadius: 16, borderWidth: 1, borderColor: '#252A35', paddingHorizontal: 13, marginBottom: 14 }, searchInput: { flex: 1, color: '#fff', fontSize: 13, marginLeft: 9, paddingVertical: 8 },
  content: { paddingBottom: 40 }, sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' }, sectionSub: { color: '#858B99', fontSize: 11, marginTop: 4, lineHeight: 17, marginBottom: 14 },
  bookGrid: { gap: 12 }, bookCard: { flexDirection: 'row', minHeight: 142, backgroundColor: '#11141B', borderRadius: 22, borderWidth: 1, borderColor: '#252A35', overflow: 'hidden' }, cover: { width: 96, height: 142, backgroundColor: '#1A1D24' }, freeBookIcon: { width: 88, height: 142, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171A20' }, bookCardBody: { flex: 1, padding: 15, justifyContent: 'center' }, bookName: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20 }, bookMeta: { color: '#858B99', fontSize: 9, marginTop: 6 }, openRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }, openText: { color: '#D9C77A', fontSize: 10, fontWeight: '800' },
  collectionHero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#11141B', borderRadius: 22, borderWidth: 1, borderColor: '#252A35', padding: 13, marginBottom: 20 }, heroCover: { width: 62, height: 88, borderRadius: 10, backgroundColor: '#1A1D24' }, heroIcon: { width: 62, height: 88, borderRadius: 10, backgroundColor: '#19180F', alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 3 }, heroSub: { color: '#858B99', fontSize: 10, marginTop: 4 },
  chapterList: { gap: 9, marginTop: 14 }, chapterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#11141B', borderRadius: 17, borderWidth: 1, borderColor: '#252A35', padding: 12 }, chapterNo: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#1A1D24', alignItems: 'center', justifyContent: 'center' }, chapterNoText: { color: '#D9C77A', fontSize: 12, fontWeight: '900' }, chapterTitle: { color: '#fff', fontSize: 13, fontWeight: '800' }, chapterSub: { color: '#747C77', fontSize: 9, marginTop: 3 },
  readerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 9 }, readerBook: { color: '#D9C77A', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, readerChapter: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 }, readerCounter: { backgroundColor: '#12161E', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 }, readerCounterText: { color: '#8D948F', fontSize: 8, fontWeight: '800' },
  languageRow: { gap: 6, paddingVertical: 5, paddingBottom: 10 }, languagePill: { borderRadius: 999, borderWidth: 1, borderColor: '#252A35', backgroundColor: '#11141B', paddingHorizontal: 11, paddingVertical: 7, minHeight: 32, alignItems: 'center', justifyContent: 'center' }, languageActive: { backgroundColor: '#211F18', borderColor: '#806B3D' }, languageText: { color: '#858B99', fontSize: 10, fontWeight: '800' }, languageActiveText: { color: '#D9C77A' },
  readerList: { gap: 11, paddingBottom: 35 }, hadithCard: { backgroundColor: '#11141B', borderRadius: 21, borderWidth: 1, borderColor: '#252A35', padding: 16 }, hadithHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, hadithRef: { color: '#D9C77A', fontSize: 10, fontWeight: '900' }, grade: { color: '#79C798', fontSize: 9, marginTop: 4 }, bookmarkButton: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#1A1D24', alignItems: 'center', justifyContent: 'center' },
  arabicSmall: { color: '#DAD8D0', fontSize: 17, lineHeight: 32, textAlign: 'right', writingDirection: 'rtl', marginTop: 12 }, languageLabel: { color: '#D9C77A', fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginTop: 13, marginBottom: 5 }, translationText: { color: '#D5D8D2', fontSize: 13, lineHeight: 22 }, urdu: { fontSize: 17, lineHeight: 31, textAlign: 'right', writingDirection: 'rtl' }, hindi: { fontSize: 15, lineHeight: 25 }, narrator: { color: '#929A95', fontSize: 10, fontWeight: '700', marginTop: 10 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#22262E' }, progressText: { color: '#7BC79B', fontSize: 9, fontWeight: '800' },
  resultsBox: { marginTop: 15, backgroundColor: '#11141B', borderRadius: 20, borderWidth: 1, borderColor: '#252A35', padding: 13 }, resultsTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 7 }, resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#22262E' }, resultNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#1B1E25', alignItems: 'center', justifyContent: 'center' }, resultNumberText: { color: '#D9C77A', fontSize: 9, fontWeight: '900' }, resultBook: { color: '#fff', fontSize: 10, fontWeight: '800' }, resultText: { color: '#858B99', fontSize: 9, lineHeight: 14, marginTop: 3 }, searching: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9 }, centerInline: { padding: 35, alignItems: 'center', gap: 8 }, muted: { color: '#7F8792', fontSize: 11 }, err: { color: '#E9A5AB', textAlign: 'center', padding: 15 },
});