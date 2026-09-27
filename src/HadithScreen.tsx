import React, { useEffect, useMemo, useState } from 'react';
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

type H = {
  id?: number;
  idInBook?: number;
  arabic?: string;
  english?: { narrator?: string; text?: string };
  reference?: { text?: string };
  grade?: string;
};

type UrduHadith = {
  hadithnumber?: number;
  hadithNumber?: number;
  hadith?: string;
  text?: string;
  narrator?: string;
};

type Book = {
  id: string;
  name: string;
  chapters: number;
  englishEdition: string;
  urduEdition: string;
};

const B: Book[] = [
  {
    id: 'bukhari',
    name: 'Sahih al-Bukhari',
    chapters: 97,
    englishEdition: 'eng-bukhari',
    urduEdition: 'urd-bukhari',
  },
  {
    id: 'muslim',
    name: 'Sahih Muslim',
    chapters: 56,
    englishEdition: 'eng-muslim',
    urduEdition: 'urd-muslim',
  },
  {
    id: 'abudawud',
    name: 'Sunan Abi Dawud',
    chapters: 43,
    englishEdition: 'eng-abudawud',
    urduEdition: 'urd-abudawud',
  },
  {
    id: 'tirmidhi',
    name: 'Jami at-Tirmidhi',
    chapters: 49,
    englishEdition: 'eng-tirmidhi',
    urduEdition: 'urd-tirmidhi',
  },
  {
    id: 'nasai',
    name: "Sunan an-Nasa'i",
    chapters: 52,
    englishEdition: 'eng-nasai',
    urduEdition: 'urd-nasai',
  },
  {
    id: 'ibnmajah',
    name: 'Sunan Ibn Majah',
    chapters: 37,
    englishEdition: 'eng-ibnmajah',
    urduEdition: 'urd-ibnmajah',
  },
];

const BASE =
  'https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_chapter/the_9_books';

const FawazBase =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to load Hadith data');
  }

  return response.json();
}

function extractEditionHadiths(value: any): UrduHadith[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.hadiths)) {
    return value.hadiths;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function getHadithNumber(item: UrduHadith): number | null {
  const value = item.hadithnumber ?? item.hadithNumber;

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  return null;
}

function getUrduText(item: UrduHadith): string {
  return item.hadith?.trim() || item.text?.trim() || '';
}

export default function HadithScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const [bi, setBi] = useState(0);
  const [ch, setCh] = useState(1);
  const [items, setItems] = useState<H[]>([]);
  const [urduMap, setUrduMap] = useState<Record<number, string>>({});
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(true);
  const [urduBusy, setUrduBusy] = useState(false);
  const [err, setErr] = useState('');
  const [urduErr, setUrduErr] = useState('');
  const book = B[bi];

  useEffect(() => {
    let cancelled = false;

    setBusy(true);
    setErr('');
    setItems([]);

    fetchJson(`${BASE}/${book.id}/${ch}.json`)
      .then((value) => {
        if (!cancelled) {
          setItems(
            Array.isArray(value)
              ? value
              : Array.isArray(value?.hadiths)
                ? value.hadiths
                : []
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setItems([]);
          setErr(
            error instanceof Error
              ? error.message
              : 'Unable to load this chapter'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [book.id, ch]);

  useEffect(() => {
    let cancelled = false;

    setUrduBusy(true);
    setUrduErr('');
    setUrduMap({});

    fetchJson(
      `${FawazBase}/${book.urduEdition}.min.json`
    )
      .then((value) => {
        if (cancelled) {
          return;
        }

        const map: Record<number, string> = {};

        extractEditionHadiths(value).forEach((item) => {
          const number = getHadithNumber(item);
          const text = getUrduText(item);

          if (number !== null && text) {
            map[number] = text;
          }
        });

        setUrduMap(map);
      })
      .catch((error) => {
        if (!cancelled) {
          setUrduMap({});
          setUrduErr(
            error instanceof Error
              ? error.message
              : 'Urdu translation unavailable'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setUrduBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [book.urduEdition]);

  const shown = useMemo(() => {
    const s = q.toLowerCase().trim();

    if (!s) {
      return items;
    }

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
      ]
        .join(' ')
        .toLowerCase()
        .includes(s)
    );
  }, [items, q, urduMap]);

  const selectBook = (index: number) => {
    setBi(index);
    setCh(1);
    setQ('');
  };

  const selectChapter = (chapter: number) => {
    setCh(chapter);
    setQ('');
  };

  return (
    <View style={s.root}>
      <View style={s.head}>
        <Pressable
          onPress={onBack}
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#fff"
          />
        </Pressable>

        <View style={s.headText}>
          <Text style={s.title}>Hadith</Text>
          <Text style={s.sub}>
            Arabic • English • Urdu
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.books}
      >
        {B.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => selectBook(index)}
            style={[
              s.book,
              index === bi && s.active,
            ]}
          >
            <Text
              style={[
                s.bookText,
                index === bi && s.gold,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.chapterHeader}>
        <Text style={s.chapterLabel}>
          Select Chapter
        </Text>

        <Text style={s.chapterCount}>
          {ch} / {book.chapters}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chapters}
      >
        {Array.from(
          { length: book.chapters },
          (_, index) => index + 1
        ).map((chapter) => (
          <Pressable
            key={chapter}
            onPress={() => selectChapter(chapter)}
            style={[
              s.chapterPill,
              chapter === ch && s.chapterPillActive,
            ]}
          >
            <Text
              style={[
                s.chapterPillText,
                chapter === ch && s.chapterPillTextActive,
              ]}
            >
              {chapter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.row}>
        <Pressable
          disabled={ch === 1}
          onPress={() => setCh((value) => value - 1)}
          style={[
            s.nav,
            ch === 1 && s.disabled,
          ]}
        >
          <Text style={s.gold}>‹</Text>
        </Pressable>

        <Text style={s.ch}>
          Chapter {ch} / {book.chapters}
        </Text>

        <Pressable
          disabled={ch === book.chapters}
          onPress={() => setCh((value) => value + 1)}
          style={[
            s.nav,
            ch === book.chapters && s.disabled,
          ]}
        >
          <Text style={s.gold}>›</Text>
        </Pressable>
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search this chapter..."
        placeholderTextColor="#68716D"
        style={s.search}
      />

      {busy ? (
        <View style={s.center}>
          <ActivityIndicator color="#D8B36A" />
          <Text style={s.muted}>
            Loading chapter...
          </Text>
        </View>
      ) : err ? (
        <View style={s.center}>
          <Text style={s.err}>{err}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {shown.length === 0 ? (
            <View style={s.centerInline}>
              <Text style={s.muted}>
                No Hadith found in this chapter.
              </Text>
            </View>
          ) : (
            shown.map((h, index) => {
              const number =
                h.idInBook ?? h.id ?? index + 1;
              const urdu = urduMap[number];

              return (
                <View
                  style={s.card}
                  key={String(h.id ?? number) + '-' + index}
                >
                  <View style={s.refRow}>
                    <Text style={s.ref}>
                      {h.reference?.text ||
                        `${book.name} • Hadith ${number}`}
                    </Text>

                    {h.grade ? (
                      <Text style={s.grade}>
                        {h.grade}
                      </Text>
                    ) : null}
                  </View>

                  {h.arabic ? (
                    <Text style={s.arabic}>
                      {h.arabic}
                    </Text>
                  ) : null}

                  {h.english?.narrator ? (
                    <Text style={s.narrator}>
                      {h.english.narrator}
                    </Text>
                  ) : null}

                  {h.english?.text ? (
                    <>
                      <Text style={s.languageLabel}>
                        ENGLISH
                      </Text>
                      <Text style={s.en}>
                        {h.english.text}
                      </Text>
                    </>
                  ) : null}

                  {urdu ? (
                    <>
                      <Text style={s.languageLabel}>
                        اردو
                      </Text>
                      <Text style={s.urdu}>
                        {urdu}
                      </Text>
                    </>
                  ) : urduBusy ? (
                    <Text style={s.translationLoading}>
                      Urdu translation loading…
                    </Text>
                  ) : (
                    <Text style={s.translationUnavailable}>
                      Urdu translation not available for this Hadith.
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {urduErr ? (
        <Text style={s.footerError}>
          Urdu source could not be loaded. English and Arabic remain available.
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080A0F',
    padding: 18,
  },

  head: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#151922',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headText: {
    flex: 1,
  },

  title: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '800',
  },

  sub: {
    color: '#7F8792',
    fontSize: 9,
    marginTop: 3,
  },

  books: {
    gap: 8,
    paddingBottom: 10,
  },

  book: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
  },

  active: {
    backgroundColor: '#211F18',
    borderColor: '#806B3D',
  },

  bookText: {
    color: '#858B99',
    fontSize: 9,
    fontWeight: '700',
  },

  gold: {
    color: '#D8B36A',
  },

  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 7,
  },

  chapterLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  chapterCount: {
    color: '#858B99',
    fontSize: 9,
    fontWeight: '700',
  },

  chapters: {
    gap: 7,
    paddingBottom: 9,
  },

  chapterPill: {
    minWidth: 38,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  chapterPillActive: {
    backgroundColor: '#211F18',
    borderColor: '#806B3D',
  },

  chapterPillText: {
    color: '#858B99',
    fontSize: 10,
    fontWeight: '800',
  },

  chapterPillTextActive: {
    color: '#D8B36A',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  nav: {
    width: 42,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#10131A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabled: {
    opacity: 0.35,
  },

  ch: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  search: {
    height: 43,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#252A35',
    backgroundColor: '#10131A',
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 10,
  },

  list: {
    gap: 10,
    paddingBottom: 30,
  },

  card: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
  },

  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  ref: {
    flex: 1,
    color: '#D8B36A',
    fontSize: 10,
    fontWeight: '800',
  },

  grade: {
    color: '#82C99F',
    fontSize: 9,
    marginTop: 0,
  },

  arabic: {
    color: '#F3F1E8',
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    marginTop: 12,
  },

  narrator: {
    color: '#9BA39D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 10,
  },

  languageLabel: {
    color: '#D8B36A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 13,
    marginBottom: 4,
  },

  en: {
    color: '#D1D5D0',
    fontSize: 12,
    lineHeight: 20,
  },

  urdu: {
    color: '#E4E6E1',
    fontSize: 16,
    lineHeight: 29,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  translationLoading: {
    color: '#68716D',
    fontSize: 9,
    marginTop: 10,
  },

  translationUnavailable: {
    color: '#68716D',
    fontSize: 9,
    marginTop: 10,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  centerInline: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  muted: {
    color: '#7F8792',
  },

  err: {
    color: '#E9A5AB',
    textAlign: 'center',
  },

  footerError: {
    color: '#A9AEB8',
    fontSize: 8,
    textAlign: 'center',
    paddingTop: 5,
  },
});
