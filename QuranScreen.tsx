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

import { SURAHS } from './src/QuranData';
import { parseQuranText, QuranSurah } from './src/quranParser';
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
import QuranArabicText from './src/QuranArabicText';

const QURAN_TEXT_URL = '/quran-uthmani.txt';

export default function QuranScreen() {
  const [quran, setQuran] = useState<QuranSurah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [language, setLanguage] =
    useState<QuranLanguage>(DEFAULT_QURAN_LANGUAGE);

  const [translation, setTranslation] = useState<TranslationMap>({});
  const [loading, setLoading] = useState(true);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [error, setError] = useState('');
  const [translationError, setTranslationError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuran();
  }, []);

  useEffect(() => {
    if (language !== 'arabic') {
      loadTranslation(language);
    } else {
      setTranslation({});
      setTranslationError('');
    }
  }, [language]);

  async function loadQuran() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(QURAN_TEXT_URL, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Quran file returned ${response.status}`);
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
      console.error('Quran loading error:', err);
      setError('Unable to load Quran. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTranslation(selectedLanguage: QuranLanguage) {
    if (selectedLanguage === 'arabic') {
      return;
    }

    const url = TRANSLATION_FILE_URLS[selectedLanguage];

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
        throw new Error(`Translation file returned ${response.status}`);
      }

      const text = await response.text();
      const parsed = parseTranslationText(text);

      setTranslation(parsed);
    } catch (err) {
      console.error('Translation loading error:', err);
      setTranslation({});
      setTranslationError(
        'This translation is not available yet. Arabic Quran remains available.'
      );
    } finally {
      setTranslationLoading(false);
    }
  }

  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return SURAHS;
    }

    return SURAHS.filter(
      (surah) =>
        surah.name.toLowerCase().includes(query) ||
        surah.englishName.toLowerCase().includes(query) ||
        String(surah.number).includes(query)
    );
  }, [search]);

  const currentSurah = quran.find(
    (surah) => surah.number === selectedSurah
  );

  const selectedLanguage = QURAN_LANGUAGES.find(
    (item) => item.id === language
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Quran...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadQuran}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (currentSurah) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.readerContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => setSelectedSurah(null)}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            <Text style={styles.backText}>Quran</Text>
          </Pressable>

          <View style={styles.readerHero}>
            <Text style={styles.surahNumber}>
              SURAH {currentSurah.number}
            </Text>

            <Text style={styles.arabicSurahName}>
              {currentSurah.arabicName}
            </Text>

            <Text style={styles.surahEnglishName}>
              {currentSurah.englishName}
            </Text>

            <Text style={styles.surahMeta}>
              {currentSurah.revelation} • {currentSurah.ayahCount} Ayahs
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageRow}
          >
            {QURAN_LANGUAGES.map((item) => {
              const active = item.id === language;

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.languageChip,
                    active && styles.languageChipActive,
                  ]}
                  onPress={() => setLanguage(item.id)}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      active && styles.languageChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceTitle}>
              {selectedLanguage?.nativeLabel}
            </Text>

            <Text style={styles.sourceText}>
              Arabic text is preserved from the existing Uthmani Quran
              source. Translation layers are loaded separately.
            </Text>
          </View>

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

          {currentSurah.ayahs.map((ayah) => {
            const translatedText =
              language === 'arabic'
                ? ''
                : getTranslation(
                    translation,
                    currentSurah.number,
                    ayah.number
                  );

            return (
              <View
                key={`${currentSurah.number}-${ayah.number}`}
                style={styles.ayahCard}
              >
                <View style={styles.ayahHeader}>
                  <View style={styles.ayahNumber}>
                    <Text style={styles.ayahNumberText}>
                      {ayah.number}
                    </Text>
                  </View>

                  <Ionicons
                    name="bookmark-outline"
                    size={21}
                    color="#8D91A3"
                  />
                </View>

                <QuranArabicText style={styles.arabicText}>
                  {ayah.text}
                </QuranArabicText>

                {language !== 'arabic' && translatedText ? (
                  <View style={styles.translationBox}>
                    <Text
                      style={[
                        styles.translationText,
                        language === 'urdu' &&
                          styles.urduTranslationText,
                      ]}
                    >
                      {translatedText}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
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
          <Text style={styles.eyebrow}>THE HOLY QURAN</Text>

          <Text style={styles.title}>Quran</Text>

          <Text style={styles.subtitle}>
            Read, reflect and continue your journey with the words of Allah.
          </Text>
        </View>

        <View style={styles.continueCard}>
          <View style={styles.continueIcon}>
            <Ionicons name="book-outline" size={25} color="#FFFFFF" />
          </View>

          <View style={styles.continueTextContainer}>
            <Text style={styles.continueLabel}>CONTINUE READING</Text>
            <Text style={styles.continueTitle}>Al-Fatihah</Text>
            <Text style={styles.continueMeta}>Ayah 1</Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8D91A3" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Surah..."
            placeholderTextColor="#777B8A"
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionTitle}>All Surahs</Text>

        <View style={styles.surahList}>
          {filteredSurahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={styles.surahCard}
              onPress={() => setSelectedSurah(surah.number)}
            >
              <View style={styles.surahNumberBox}>
                <Text style={styles.surahNumberText}>
                  {surah.number}
                </Text>
              </View>

              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{surah.name}</Text>

                <Text style={styles.surahEnglish}>
                  {surah.englishName}
                </Text>

                <Text style={styles.surahDetails}>
                  {surah.revelation} • {surah.ayahCount} Ayahs
                </Text>
              </View>

              <View style={styles.surahArabicContainer}>
                <Text style={styles.surahArabic}>
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

  languageRow: {
    gap: 9,
    paddingVertical: 18,
  },

  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#141821',
    borderWidth: 1,
    borderColor: '#282D38',
  },

  languageChipActive: {
    backgroundColor: '#D8B36A',
    borderColor: '#D8B36A',
  },

  languageChipText: {
    color: '#A2A6B3',
    fontSize: 13,
    fontWeight: '700',
  },

  languageChipTextActive: {
    color: '#101114',
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

  ayahCard: {
    backgroundColor: '#10131A',
    borderRadius: 20,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#202530',
  },

  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  ayahNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#1B1F28',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahNumberText: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '800',
  },

  arabicText: {
    color: '#F2EBDD',
    fontSize: 25,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  translationBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#272C37',
  },

  translationText: {
    color: '#C5C8D1',
    fontSize: 15,
    lineHeight: 25,
  },

  urduTranslationText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontSize: 17,
    lineHeight: 30,
  },

  surahArabic: {
    color: '#E9E1D2',
    fontSize: 20,
    marginBottom: 5,
  },
});
