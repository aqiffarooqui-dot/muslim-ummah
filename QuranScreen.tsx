import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type QuranScreenProps = {
  onBack: () => void;
};

type Surah = {
  number: number;
  name: string;
  englishName: string;
  translation: string;
  ayahs: number;
  revelation: 'Meccan' | 'Medinan';
};

const surahs: Surah[] = [
  {
    number: 1,
    name: 'الفاتحة',
    englishName: 'Al-Fatihah',
    translation: 'The Opening',
    ayahs: 7,
    revelation: 'Meccan',
  },
  {
    number: 2,
    name: 'البقرة',
    englishName: 'Al-Baqarah',
    translation: 'The Cow',
    ayahs: 286,
    revelation: 'Medinan',
  },
  {
    number: 3,
    name: 'آل عمران',
    englishName: 'Aal-E-Imran',
    translation: 'The Family of Imran',
    ayahs: 200,
    revelation: 'Medinan',
  },
  {
    number: 4,
    name: 'النساء',
    englishName: 'An-Nisa',
    translation: 'The Women',
    ayahs: 176,
    revelation: 'Medinan',
  },
  {
    number: 5,
    name: 'المائدة',
    englishName: 'Al-Maidah',
    translation: 'The Table Spread',
    ayahs: 120,
    revelation: 'Medinan',
  },
  {
    number: 6,
    name: 'الأنعام',
    englishName: 'Al-Anam',
    translation: 'The Cattle',
    ayahs: 165,
    revelation: 'Meccan',
  },
];

export default function QuranScreen({ onBack }: QuranScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return surahs;
    }

    return surahs.filter(
      (surah) =>
        surah.englishName.toLowerCase().includes(query) ||
        surah.translation.toLowerCase().includes(query) ||
        surah.name.includes(search.trim()) ||
        String(surah.number) === query,
    );
  }, [search]);

  if (selectedSurah) {
    return (
      <View style={styles.container}>
        <View style={styles.readerHeader}>
          <Pressable style={styles.backButton} onPress={() => setSelectedSurah(null)}>
            <Ionicons name="arrow-back" size={21} color="#E9EAE3" />
          </Pressable>

          <View style={styles.readerTitleWrap}>
            <Text style={styles.readerTitle}>{selectedSurah.englishName}</Text>
            <Text style={styles.readerSubtitle}>
              Surah {selectedSurah.number} • {selectedSurah.ayahs} Ayahs
            </Text>
          </View>

          <Pressable style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={20} color="#D9C77A" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.readerContent}
        >
          <View style={styles.surahHero}>
            <Text style={styles.surahArabicLarge}>{selectedSurah.name}</Text>

            <Text style={styles.surahEnglishLarge}>
              {selectedSurah.englishName}
            </Text>

            <Text style={styles.surahTranslation}>
              {selectedSurah.translation}
            </Text>

            <View style={styles.surahMetaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{selectedSurah.revelation}</Text>
              </View>

              <View style={styles.metaPill}>
                <Text style={styles.metaText}>
                  {selectedSurah.ayahs} Ayahs
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bismillahCard}>
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
          </View>

          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIcon}>
              <Ionicons name="book-outline" size={24} color="#D9C77A" />
            </View>

            <Text style={styles.comingSoonTitle}>Quran reader is next</Text>

            <Text style={styles.comingSoonText}>
              The complete verified Quran text, translations, bookmarks and
              reading progress will be connected in the next Quran data step.
            </Text>
          </View>

          <View style={styles.readerNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#8E9A92" />

            <Text style={styles.readerNoteText}>
              Quran content will be added from a verified source. We will not
              generate Quran verses with AI.
            </Text>
          </View>

          <View style={styles.bottomReaderSpace} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={21} color="#E9EAE3" />
            </Pressable>

            <View>
              <Text style={styles.eyebrow}>THE HOLY QURAN</Text>
              <Text style={styles.title}>Quran</Text>
            </View>
          </View>

          <Pressable style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={20} color="#D9C77A" />
          </Pressable>
        </View>

        <View style={styles.continueCard}>
          <View style={styles.continueIcon}>
            <Ionicons name="play" size={19} color="#101512" />
          </View>

          <View style={styles.continueInfo}>
            <Text style={styles.continueLabel}>CONTINUE READING</Text>
            <Text style={styles.continueTitle}>Al-Baqarah • Ayah 255</Text>
            <Text style={styles.continueSubtitle}>Ayat-ul-Kursi</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#737D77" />
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#6F7973" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Surah..."
            placeholderTextColor="#68736C"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={19} color="#6F7973" />
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Surahs</Text>
            <Text style={styles.sectionSubtitle}>
              114 chapters of the Holy Quran
            </Text>
          </View>

          <Text style={styles.surahCount}>114</Text>
        </View>

        <View style={styles.list}>
          {filteredSurahs.map((surah) => (
            <Pressable
              key={surah.number}
              style={({ pressed }) => [
                styles.surahCard,
                pressed && styles.surahCardPressed,
              ]}
              onPress={() => setSelectedSurah(surah)}
            >
              <View style={styles.numberBox}>
                <Text style={styles.numberText}>{surah.number}</Text>
              </View>

              <View style={styles.surahInfo}>
                <Text style={styles.englishName}>{surah.englishName}</Text>

                <Text style={styles.translation}>{surah.translation}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>{surah.revelation}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.infoText}>{surah.ayahs} Ayahs</Text>
                </View>
              </View>

              <View style={styles.arabicWrap}>
                <Text style={styles.arabicName}>{surah.name}</Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#59645E"
                  style={styles.chevron}
                />
              </View>
            </Pressable>
          ))}

          {filteredSurahs.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={25} color="#D9C77A" />
              </View>

              <Text style={styles.emptyTitle}>No Surah found</Text>

              <Text style={styles.emptyText}>
                Try searching by Surah name or number.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07100D',
  },

  scrollContent: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyebrow: {
    color: '#89938D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  title: {
    color: '#F0F0E7',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  continueCard: {
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: '#13251E',
    borderWidth: 1,
    borderColor: '#294239',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  continueIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#D9C77A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueInfo: {
    flex: 1,
    marginLeft: 13,
  },

  continueLabel: {
    color: '#89968E',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  continueTitle: {
    color: '#E9EAE3',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },

  continueSubtitle: {
    color: '#758078',
    fontSize: 10,
    marginTop: 3,
  },

  searchBox: {
    height: 52,
    borderRadius: 18,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#25342C',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    color: '#E9EAE3',
    fontSize: 13,
    marginLeft: 10,
    paddingVertical: 0,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#EDEDE5',
    fontSize: 20,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#737D77',
    fontSize: 10,
    marginTop: 4,
  },

  surahCount: {
    color: '#D9C77A',
    fontSize: 12,
    fontWeight: '800',
  },

  list: {
    gap: 9,
  },

  surahCard: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  surahCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  numberBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    color: '#D9C77A',
    fontSize: 12,
    fontWeight: '800',
  },

  surahInfo: {
    flex: 1,
    marginLeft: 12,
  },

  englishName: {
    color: '#E7E9E2',
    fontSize: 14,
    fontWeight: '700',
  },

  translation: {
    color: '#78847D',
    fontSize: 10,
    marginTop: 3,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  infoText: {
    color: '#5F6B64',
    fontSize: 8,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#59645E',
    marginHorizontal: 6,
  },

  arabicWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 83,
  },

  arabicName: {
    color: '#D8DCCF',
    fontSize: 19,
    fontWeight: '500',
  },

  chevron: {
    marginTop: 7,
  },

  emptyState: {
    minHeight: 220,
    borderRadius: 22,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    color: '#E9EAE3',
    fontSize: 17,
    fontWeight: '700',
  },

  emptyText: {
    color: '#737D77',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },

  readerHeader: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  readerTitleWrap: {
    flex: 1,
  },

  readerTitle: {
    color: '#EDEDE5',
    fontSize: 18,
    fontWeight: '700',
  },

  readerSubtitle: {
    color: '#737D77',
    fontSize: 9,
    marginTop: 3,
  },

  readerContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  surahHero: {
    minHeight: 205,
    borderRadius: 25,
    backgroundColor: '#13251E',
    borderWidth: 1,
    borderColor: '#294239',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  surahArabicLarge: {
    color: '#E5E2D0',
    fontSize: 34,
    textAlign: 'center',
    marginBottom: 13,
  },

  surahEnglishLarge: {
    color: '#F0F0E7',
    fontSize: 21,
    fontWeight: '700',
  },

  surahTranslation: {
    color: '#87928B',
    fontSize: 11,
    marginTop: 4,
  },

  surahMetaRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },

  metaPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1D3027',
  },

  metaText: {
    color: '#AAB4AD',
    fontSize: 9,
    fontWeight: '700',
  },

  bismillahCard: {
    marginTop: 13,
    minHeight: 72,
    borderRadius: 20,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  bismillah: {
    color: '#D9C77A',
    fontSize: 21,
    textAlign: 'center',
  },

  comingSoonCard: {
    marginTop: 13,
    borderRadius: 22,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 20,
    alignItems: 'center',
  },

  comingSoonIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  comingSoonTitle: {
    color: '#E9EAE3',
    fontSize: 17,
    fontWeight: '700',
  },

  comingSoonText: {
    color: '#737D77',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },

  readerNote: {
    marginTop: 13,
    borderRadius: 18,
    backgroundColor: '#0D1713',
    borderWidth: 1,
    borderColor: '#202E27',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  readerNoteText: {
    flex: 1,
    color: '#68736C',
    fontSize: 10,
    lineHeight: 16,
  },

  bottomSpace: {
    height: 80,
  },

  bottomReaderSpace: {
    height: 80,
  },
});
