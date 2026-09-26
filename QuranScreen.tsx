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

import { SURAHS, Surah } from './src/QuranData';
import { parseQuranText, QuranSurah } from './src/quranParser';

type QuranScreenProps = {
  onBack?: () => void;
};

const QURAN_TEXT_URL = '/quran-uthmani.txt';

export default function QuranScreen({ onBack }: QuranScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [quranSurahs, setQuranSurahs] = useState<QuranSurah[]>([]);
  const [loadingQuran, setLoadingQuran] = useState(true);
  const [quranError, setQuranError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadQuran = async () => {
      try {
        setLoadingQuran(true);
        setQuranError(false);

        const response = await fetch(QURAN_TEXT_URL, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load Quran text: ${response.status}`
          );
        }

        const text = await response.text();

        if (!text.trim()) {
          throw new Error('Quran text file is empty');
        }

        const parsed = parseQuranText(text);

        if (parsed.length !== 114) {
          throw new Error(
            `Expected 114 Surahs but loaded ${parsed.length}`
          );
        }

        if (mounted) {
          setQuranSurahs(parsed);
          setLoadingQuran(false);
        }
      } catch (error) {
        console.error('Quran loading error:', error);

        if (mounted) {
          setQuranSurahs([]);
          setQuranError(true);
          setLoadingQuran(false);
        }
      }
    };

    loadQuran();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return SURAHS;
    }

    return SURAHS.filter((surah) => {
      return (
        surah.name.toLowerCase().includes(query) ||
        surah.englishName.toLowerCase().includes(query) ||
        surah.arabicName.includes(search.trim()) ||
        String(surah.number).includes(query)
      );
    });
  }, [search]);

  const selectedQuranSurah = useMemo(() => {
    if (!selectedSurah) {
      return null;
    }

    return (
      quranSurahs.find(
        (surah) => surah.number === selectedSurah.number
      ) ?? null
    );
  }, [quranSurahs, selectedSurah]);

  if (selectedSurah) {
    return (
      <View style={styles.container}>
        <View style={styles.readerHeader}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setSelectedSurah(null)}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.readerTitle}>
            <Text style={styles.readerSurahName}>
              {selectedSurah.name}
            </Text>

            <Text style={styles.readerSubtitle}>
              Surah {selectedSurah.number} •{' '}
              {selectedSurah.ayahCount} Ayahs
            </Text>
          </View>

          <Pressable style={styles.iconButton}>
            <Ionicons
              name="bookmark-outline"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.readerScroll}
          contentContainerStyle={styles.readerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.readerHero}>
            <Text style={styles.readerArabicName}>
              {selectedSurah.arabicName}
            </Text>

            <Text style={styles.readerEnglishName}>
              {selectedSurah.englishName}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>
                  {selectedSurah.revelation}
                </Text>
              </View>

              <View style={styles.metaPill}>
                <Text style={styles.metaText}>
                  {selectedSurah.ayahCount} Ayahs
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sourceCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color="#D7B56D"
            />

            <Text style={styles.sourceText}>
              Arabic Quran text • Tanzil Uthmani
            </Text>
          </View>

          {loadingQuran ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="small"
                color="#D7B56D"
              />

              <Text style={styles.loadingTitle}>
                Loading Quran...
              </Text>

              <Text style={styles.loadingText}>
                Preparing the Arabic Ayahs.
              </Text>
            </View>
          ) : quranError ? (
            <View style={styles.emptyReader}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color="#D7B56D"
              />

              <Text style={styles.emptyTitle}>
                Quran text could not be loaded
              </Text>

              <Text style={styles.emptyText}>
                Please check the Quran text file and try again.
              </Text>
            </View>
          ) : selectedQuranSurah?.ayahs.length ? (
            <View style={styles.ayahList}>
              {selectedQuranSurah.ayahs.map((ayah) => (
                <View
                  key={`${selectedSurah.number}-${ayah.number}`}
                  style={styles.ayahCard}
                >
                  <View style={styles.ayahTopRow}>
                    <View style={styles.ayahNumber}>
                      <Text style={styles.ayahNumberText}>
                        {ayah.number}
                      </Text>
                    </View>

                    <Pressable style={styles.ayahBookmark}>
                      <Ionicons
                        name="bookmark-outline"
                        size={18}
                        color="#737C89"
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.ayahArabic}>
                    {ayah.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyReader}>
              <Ionicons
                name="book-outline"
                size={40}
                color="#D7B56D"
              />

              <Text style={styles.emptyTitle}>
                Ayahs not found
              </Text>

              <Text style={styles.emptyText}>
                No Arabic Ayahs were found for this Surah.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>
              THE HOLY QURAN
            </Text>

            <Text style={styles.title}>
              Quran
            </Text>
          </View>

          <Pressable style={styles.topIcon}>
            <Ionicons
              name="bookmark-outline"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <Pressable
          style={styles.continueCard}
          onPress={() => setSelectedSurah(SURAHS[0])}
        >
          <View style={styles.continueIcon}>
            <Ionicons
              name="book-outline"
              size={24}
              color="#D7B56D"
            />
          </View>

          <View style={styles.continueText}>
            <Text style={styles.continueLabel}>
              CONTINUE READING
            </Text>

            <Text style={styles.continueTitle}>
              Al-Fatihah
            </Text>

            <Text style={styles.continueMeta}>
              Ayah 1 • Last read
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#9CA3AF"
          />
        </Pressable>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#8E96A3"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Surah"
            placeholderTextColor="#727986"
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color="#727986"
              />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              All Surahs
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredSurahs.length} of {SURAHS.length} Surahs
            </Text>
          </View>

          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              114
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {filteredSurahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={({ pressed }) => [
                styles.surahCard,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedSurah(surah)}
            >
              <View style={styles.numberBox}>
                <Text style={styles.numberText}>
                  {surah.number}
                </Text>
              </View>

              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>
                  {surah.name}
                </Text>

                <Text style={styles.surahMeta}>
                  {surah.englishName} • {surah.revelation}
                </Text>

                <Text style={styles.ayahCount}>
                  {surah.ayahCount} Ayahs
                </Text>
              </View>

              <View style={styles.arabicSide}>
                <Text style={styles.arabicName}>
                  {surah.arabicName}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#6F7785"
                />
              </View>
            </Pressable>
          ))}
        </View>

        {filteredSurahs.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons
              name="search-outline"
              size={36}
              color="#6F7785"
            />

            <Text style={styles.noResultsTitle}>
              No Surah found
            </Text>

            <Text style={styles.noResultsText}>
              Try another Surah name or number.
            </Text>
          </View>
        )}

        <View style={styles.footerNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#D7B56D"
          />

          <Text style={styles.footerText}>
            Quran Arabic text: Tanzil Uthmani.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B10',
  },

  content: {
    padding: 20,
    paddingBottom: 110,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  eyebrow: {
    color: '#8D96A5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 5,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },

  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151A22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121820',
    borderWidth: 1,
    borderColor: '#242C38',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },

  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1D252D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  continueText: {
    flex: 1,
  },

  continueLabel: {
    color: '#89919E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },

  continueTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  continueMeta: {
    color: '#858D99',
    fontSize: 12,
    marginTop: 3,
  },

  searchBox: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#121820',
    borderWidth: 1,
    borderColor: '#242C38',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 0,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#747D8A',
    fontSize: 12,
    marginTop: 3,
  },

  totalBadge: {
    minWidth: 42,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#1B2527',
    alignItems: 'center',
    justifyContent: 'center',
  },

  totalBadgeText: {
    color: '#D7B56D',
    fontSize: 13,
    fontWeight: '800',
  },

  list: {
    gap: 10,
  },

  surahCard: {
    minHeight: 92,
    backgroundColor: '#11171F',
    borderWidth: 1,
    borderColor: '#202832',
    borderRadius: 20,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  numberBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1B222C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  numberText: {
    color: '#D7B56D',
    fontSize: 13,
    fontWeight: '800',
  },

  surahInfo: {
    flex: 1,
  },

  surahName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  surahMeta: {
    color: '#858D99',
    fontSize: 11,
    marginTop: 4,
  },

  ayahCount: {
    color: '#626B78',
    fontSize: 11,
    marginTop: 3,
  },

  arabicSide: {
    alignItems: 'flex-end',
    marginLeft: 8,
    maxWidth: 110,
  },

  arabicName: {
    color: '#D7B56D',
    fontSize: 18,
    marginBottom: 5,
  },

  noResults: {
    alignItems: 'center',
    paddingVertical: 50,
  },

  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  noResultsText: {
    color: '#737C89',
    fontSize: 13,
    marginTop: 5,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingHorizontal: 15,
  },

  footerText: {
    color: '#69727F',
    fontSize: 11,
    marginLeft: 7,
    textAlign: 'center',
  },

  readerHeader: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1C232D',
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#151B23',
    alignItems: 'center',
    justifyContent: 'center',
  },

  readerTitle: {
    flex: 1,
    alignItems: 'center',
  },

  readerSurahName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  readerSubtitle: {
    color: '#747D8A',
    fontSize: 11,
    marginTop: 3,
  },

  readerScroll: {
    flex: 1,
  },

  readerContent: {
    padding: 20,
    paddingBottom: 80,
  },

  readerHero: {
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#242D38',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 15,
  },

  readerArabicName: {
    color: '#D7B56D',
    fontSize: 38,
    marginBottom: 9,
  },

  readerEnglishName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  metaPill: {
    backgroundColor: '#1B232C',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  metaText: {
    color: '#8D96A3',
    fontSize: 11,
    fontWeight: '700',
  },

  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A1D',
    borderWidth: 1,
    borderColor: '#30332F',
    borderRadius: 17,
    padding: 13,
    marginBottom: 15,
  },

  sourceText: {
    color: '#929AA3',
    fontSize: 12,
    marginLeft: 9,
  },

  loadingCard: {
    backgroundColor: '#11171F',
    borderWidth: 1,
    borderColor: '#202832',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
  },

  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 13,
  },

  loadingText: {
    color: '#78818E',
    fontSize: 13,
    marginTop: 6,
  },

  ayahList: {
    gap: 12,
  },

  ayahCard: {
    backgroundColor: '#11171F',
    borderWidth: 1,
    borderColor: '#202832',
    borderRadius: 22,
    padding: 18,
  },

  ayahTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  ayahNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1B222C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahNumberText: {
    color: '#D7B56D',
    fontSize: 11,
    fontWeight: '800',
  },

  ayahBookmark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#171E27',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahArabic: {
    color: '#F3EBDD',
    fontSize: 25,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  emptyReader: {
    backgroundColor: '#11171F',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#202832',
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 13,
    textAlign: 'center',
  },

  emptyText: {
    color: '#78818E',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
});
