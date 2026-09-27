import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import QuranScreen from './QuranScreen';
import QuranBookmarksScreen from './src/QuranBookmarksScreen';
import AboutScreen from './AboutScreen';
import { SURAHS } from './src/QuranData';
import { getQuranProgress } from './src/quranProgress';

type Tab = 'Home' | 'Quran' | 'Hadith' | 'Prayer' | 'More';

type QuranOpenRequest = {
  surahNumber: number;
  ayahNumber: number;
} | null;

const prayers = [
  { name: 'Fajr', time: '05:02 AM', icon: 'sunny-outline' as const },
  { name: 'Dhuhr', time: '12:18 PM', icon: 'sunny' as const },
  { name: 'Asr', time: '04:42 PM', icon: 'partly-sunny-outline' as const },
  { name: 'Maghrib', time: '06:29 PM', icon: 'moon-outline' as const },
  { name: 'Isha', time: '07:48 PM', icon: 'moon' as const },
];

const quickItems = [
  {
    title: 'Quran',
    subtitle: 'Read & listen',
    icon: 'book-outline' as const,
  },
  {
    title: 'Hadith',
    subtitle: 'Daily wisdom',
    icon: 'library-outline' as const,
  },
  {
    title: 'Duas',
    subtitle: 'Supplications',
    icon: 'heart-outline' as const,
  },
  {
    title: 'Prayer',
    subtitle: 'Prayer times',
    icon: 'time-outline' as const,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [showAbout, setShowAbout] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const [quranOpenRequest, setQuranOpenRequest] =
    useState<QuranOpenRequest>(null);

  const [quranProgress, setQuranProgress] = useState({
    surahNumber: 1,
    ayahNumber: 1,
  });

  useEffect(() => {
    loadQuranProgress();
  }, []);

  async function loadQuranProgress() {
    try {
      const progress = await getQuranProgress();

      if (progress) {
        setQuranProgress(progress);
      }
    } catch (err) {
      console.error(
        'Quran progress loading error:',
        err
      );
    }
  }

  const currentProgressSurah =
    SURAHS.find(
      (surah) =>
        surah.number ===
        quranProgress.surahNumber
    ) || SURAHS[0];

  const progressPercentage = Math.min(
    100,
    Math.max(
      3,
      (quranProgress.ayahNumber /
        currentProgressSurah.ayahCount) *
        100
    )
  );

  const openAbout = () => {
    setShowAbout(true);
    setShowBookmarks(false);
  };

  const closeAbout = () => {
    setShowAbout(false);
  };

  const openBookmarks = () => {
    setShowBookmarks(true);
    setShowAbout(false);
  };

  const closeBookmarks = () => {
    setShowBookmarks(false);
  };

  const openQuran = async () => {
    setShowBookmarks(false);
    setShowAbout(false);

    try {
      const progress = await getQuranProgress();

      if (progress) {
        setQuranProgress(progress);

        setQuranOpenRequest({
          surahNumber: progress.surahNumber,
          ayahNumber: progress.ayahNumber,
        });
      } else {
        setQuranOpenRequest({
          surahNumber: 1,
          ayahNumber: 1,
        });
      }
    } catch (err) {
      console.error(
        'Quran progress refresh error:',
        err
      );

      setQuranOpenRequest({
        surahNumber: quranProgress.surahNumber,
        ayahNumber: quranProgress.ayahNumber,
      });
    }

    setActiveTab('Quran');
  };

  const openContinueQuran = async () => {
    setShowBookmarks(false);
    setShowAbout(false);

    try {
      const progress = await getQuranProgress();

      if (progress) {
        setQuranProgress(progress);

        setQuranOpenRequest({
          surahNumber: progress.surahNumber,
          ayahNumber: progress.ayahNumber,
        });
      } else {
        setQuranOpenRequest({
          surahNumber: 1,
          ayahNumber: 1,
        });
      }
    } catch (err) {
      console.error(
        'Quran progress refresh error:',
        err
      );

      setQuranOpenRequest({
        surahNumber: quranProgress.surahNumber,
        ayahNumber: quranProgress.ayahNumber,
      });
    }

    setActiveTab('Quran');
  };

  const openBookmarkedAyah = (
    surahNumber: number,
    ayahNumber: number
  ) => {
    setShowBookmarks(false);
    setShowAbout(false);

    setQuranOpenRequest({
      surahNumber,
      ayahNumber,
    });

    setActiveTab('Quran');
  };

  const renderHome = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            ASSALAMU ALAIKUM
          </Text>

          <Text style={styles.appTitle}>
            Muslim Ummah
          </Text>
        </View>

        <Pressable style={styles.profileButton}>
          <Ionicons
            name="person-outline"
            size={21}
            color="#E8E7D8"
          />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroTop}>
          <View style={styles.smallIconCircle}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color="#D9C77A"
            />
          </View>

          <Text style={styles.heroLabel}>
            TODAY'S REMINDER
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Make your heart{'\n'}remember Allah.
        </Text>

        <Text style={styles.heroDescription}>
          Take a moment to pause, reflect and reconnect
          with your faith.
        </Text>

        <Pressable
          style={styles.heroButton}
          onPress={openQuran}
        >
          <Text style={styles.heroButtonText}>
            Open Quran
          </Text>

          <Ionicons
            name="arrow-forward"
            size={17}
            color="#101512"
          />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Next Prayer
          </Text>

          <Text style={styles.sectionSubtitle}>
            Your daily prayer schedule
          </Text>
        </View>

        <Ionicons
          name="location-outline"
          size={19}
          color="#8C938D"
        />
      </View>

      <View style={styles.prayerCard}>
        <View>
          <Text style={styles.nextPrayerLabel}>
            NEXT PRAYER
          </Text>

          <Text style={styles.nextPrayerName}>
            Asr
          </Text>

          <Text style={styles.nextPrayerTime}>
            04:42 PM
          </Text>
        </View>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownLabel}>
            STARTS IN
          </Text>

          <Text style={styles.countdown}>
            01:24:18
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.prayerRow}
      >
        {prayers.map((prayer) => (
          <View
            key={prayer.name}
            style={styles.prayerMiniCard}
          >
            <Ionicons
              name={prayer.icon}
              size={19}
              color="#B9C1BA"
            />

            <Text style={styles.prayerMiniName}>
              {prayer.name}
            </Text>

            <Text style={styles.prayerMiniTime}>
              {prayer.time}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Continue Quran
          </Text>

          <Text style={styles.sectionSubtitle}>
            Pick up where you left off
          </Text>
        </View>

        <Pressable onPress={openQuran}>
          <Text style={styles.seeAll}>
            See all
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.quranCard}
        onPress={openContinueQuran}
      >
        <View style={styles.quranIcon}>
          <Ionicons
            name="book"
            size={25}
            color="#D9C77A"
          />
        </View>

        <View style={styles.quranInfo}>
          <Text style={styles.quranSurah}>
            Surah {currentProgressSurah.englishName}
          </Text>

          <Text style={styles.quranAyah}>
            Ayah {quranProgress.ayahNumber}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            Continue reading
          </Text>
        </View>

        <Ionicons
          name="play-circle"
          size={34}
          color="#D9C77A"
        />
      </Pressable>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            For Your Day
          </Text>

          <Text style={styles.sectionSubtitle}>
            Small reminders, every day
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dailyRow}
      >
        <View style={styles.dailyCard}>
          <View style={styles.dailyIcon}>
            <Ionicons
              name="book-outline"
              size={20}
              color="#D9C77A"
            />
          </View>

          <Text style={styles.dailyLabel}>
            AYAH OF THE DAY
          </Text>

          <Text style={styles.dailyText}>
            “Indeed, in the remembrance of Allah do hearts
            find rest.”
          </Text>

          <Text style={styles.dailyReference}>
            Quran 13:28
          </Text>
        </View>

        <View style={styles.dailyCard}>
          <View style={styles.dailyIcon}>
            <Ionicons
              name="heart-outline"
              size={20}
              color="#D9C77A"
            />
          </View>

          <Text style={styles.dailyLabel}>
            DUA OF THE DAY
          </Text>

          <Text style={styles.dailyText}>
            “Our Lord, give us good in this world and good
            in the Hereafter.”
          </Text>

          <Text style={styles.dailyReference}>
            Quran 2:201
          </Text>
        </View>
      </ScrollView>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Explore
          </Text>

          <Text style={styles.sectionSubtitle}>
            Everything you need in one place
          </Text>
        </View>
      </View>

      <View style={styles.exploreGrid}>
        {quickItems.map((item) => (
          <Pressable
            key={item.title}
            style={styles.exploreCard}
            onPress={() => {
              if (item.title === 'Quran') {
                openQuran();
              }

              if (item.title === 'Hadith') {
                setActiveTab('Hadith');
              }

              if (item.title === 'Prayer') {
                setActiveTab('Prayer');
              }
            }}
          >
            <View style={styles.exploreIcon}>
              <Ionicons
                name={item.icon}
                size={23}
                color="#D9C77A"
              />
            </View>

            <Text style={styles.exploreTitle}>
              {item.title}
            </Text>

            <Text style={styles.exploreSubtitle}>
              {item.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );

  const renderPlaceholder = () => (
    <View style={styles.placeholderScreen}>
      <View style={styles.placeholderIcon}>
        <Ionicons
          name={
            activeTab === 'Hadith'
              ? 'library-outline'
              : activeTab === 'Prayer'
              ? 'time-outline'
              : 'grid-outline'
          }
          size={34}
          color="#D9C77A"
        />
      </View>

      <Text style={styles.placeholderTitle}>
        {activeTab}
      </Text>

      <Text style={styles.placeholderText}>
        This section is being prepared for the Muslim
        Ummah experience.
      </Text>

      <Pressable
        style={styles.backHomeButton}
        onPress={() => setActiveTab('Home')}
      >
        <Text style={styles.backHomeText}>
          Back to Home
        </Text>
      </Pressable>
    </View>
  );

  const renderMore = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.moreContent}
    >
      <View style={styles.moreHeader}>
        <View>
          <Text style={styles.eyebrow}>
            MUSLIM UMMAH
          </Text>

          <Text style={styles.moreTitle}>
            More
          </Text>
        </View>

        <View style={styles.moreHeaderIcon}>
          <Ionicons
            name="grid-outline"
            size={21}
            color="#D9C77A"
          />
        </View>
      </View>

      <View style={styles.moreHero}>
        <View style={styles.moreHeroIcon}>
          <Ionicons
            name="moon-outline"
            size={30}
            color="#D9C77A"
          />
        </View>

        <View style={styles.moreHeroInfo}>
          <Text style={styles.moreHeroTitle}>
            Muslim Ummah
          </Text>

          <Text style={styles.moreHeroText}>
            Your modern Islamic companion
          </Text>
        </View>
      </View>

      <Text style={styles.moreSectionTitle}>
        Quran
      </Text>

      <Pressable
        style={styles.moreItem}
        onPress={openBookmarks}
      >
        <View style={styles.moreItemIcon}>
          <Ionicons
            name="bookmark-outline"
            size={21}
            color="#D9C77A"
          />
        </View>

        <View style={styles.moreItemInfo}>
          <Text style={styles.moreItemTitle}>
            Saved Ayahs
          </Text>

          <Text style={styles.moreItemSubtitle}>
            Your bookmarked Quran verses
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#59645E"
        />
      </Pressable>

      <Text style={styles.moreSectionTitle}>
        App
      </Text>

      <Pressable
        style={styles.moreItem}
        onPress={openAbout}
      >
        <View style={styles.moreItemIcon}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#D9C77A"
          />
        </View>

        <View style={styles.moreItemInfo}>
          <Text style={styles.moreItemTitle}>
            About Muslim Ummah
          </Text>

          <Text style={styles.moreItemSubtitle}>
            Features, developer and app information
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#59645E"
        />
      </Pressable>

      <View style={styles.moreItem}>
        <View style={styles.moreItemIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color="#D9C77A"
          />
        </View>

        <View style={styles.moreItemInfo}>
          <Text style={styles.moreItemTitle}>
            Privacy
          </Text>

          <Text style={styles.moreItemSubtitle}>
            Your privacy and app data information
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#59645E"
        />
      </View>

      <View style={styles.moreItem}>
        <View style={styles.moreItemIcon}>
          <Ionicons
            name="settings-outline"
            size={21}
            color="#D9C77A"
          />
        </View>

        <View style={styles.moreItemInfo}>
          <Text style={styles.moreItemTitle}>
            Settings
          </Text>

          <Text style={styles.moreItemSubtitle}>
            App preferences and customization
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#59645E"
        />
      </View>

      <View style={styles.moreVersionCard}>
        <Text style={styles.moreVersionLabel}>
          APP VERSION
        </Text>

        <Text style={styles.moreVersion}>
          1.0.0
        </Text>

        <Text style={styles.moreVersionText}>
          Muslim Ummah • Free Islamic Companion
        </Text>
      </View>

      <View style={styles.moreBottomSpace} />
    </ScrollView>
  );

  const renderContent = () => {
    if (showAbout) {
      return (
        <AboutScreen
          onBack={closeAbout}
        />
      );
    }

    if (showBookmarks) {
      return (
        <QuranBookmarksScreen
          onBack={closeBookmarks}
          onOpenAyah={openBookmarkedAyah}
        />
      );
    }

    if (activeTab === 'Quran') {
      return (
        <QuranScreen
          onBack={() => {
            setQuranOpenRequest(null);
            setActiveTab('Home');
          }}
          initialSurah={
            quranOpenRequest?.surahNumber
          }
          initialAyah={
            quranOpenRequest?.ayahNumber
          }
        />
      );
    }

    if (activeTab === 'Home') {
      return renderHome();
    }

    if (activeTab === 'More') {
      return renderMore();
    }

    return renderPlaceholder();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {renderContent()}

      {!showAbout && !showBookmarks && (
        <View style={styles.bottomNav}>
          <NavItem
            label="Home"
            icon="home"
            active={activeTab === 'Home'}
            onPress={() => {
              setQuranOpenRequest(null);
              setActiveTab('Home');
              loadQuranProgress();
            }}
          />

          <NavItem
            label="Quran"
            icon="book-outline"
            active={activeTab === 'Quran'}
            onPress={openQuran}
          />

          <NavItem
            label="Hadith"
            icon="library-outline"
            active={activeTab === 'Hadith'}
            onPress={() => {
              setQuranOpenRequest(null);
              setActiveTab('Hadith');
            }}
          />

          <NavItem
            label="Prayer"
            icon="time-outline"
            active={activeTab === 'Prayer'}
            onPress={() => {
              setQuranOpenRequest(null);
              setActiveTab('Prayer');
            }}
          />

          <NavItem
            label="More"
            icon="grid-outline"
            active={activeTab === 'More'}
            onPress={() => {
              setQuranOpenRequest(null);
              setActiveTab('More');
            }}
          />
        </View>
      )}
    </View>
  );
}

type NavItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function NavItem({
  label,
  icon,
  active,
  onPress,
}: NavItemProps) {
  return (
    <Pressable
      style={styles.navItem}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={21}
        color={active ? '#D9C77A' : '#6F7771'}
      />

      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07100D',
  },

  scrollContent: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  eyebrow: {
    color: '#89938D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 5,
  },

  appTitle: {
    color: '#F0F0E7',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  profileButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#27352F',
    backgroundColor: '#111B17',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    minHeight: 260,
    borderRadius: 27,
    backgroundColor: '#13251E',
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#294239',
    justifyContent: 'space-between',
  },

  heroGlowOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#1D4937',
    opacity: 0.45,
    right: -85,
    top: -75,
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#816D28',
    opacity: 0.13,
    left: -60,
    bottom: -50,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  smallIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#263A31',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroLabel: {
    color: '#AEB8B1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  heroTitle: {
    color: '#F3F1E7',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginTop: 22,
  },

  heroDescription: {
    color: '#AAB4AD',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 310,
    marginTop: 10,
  },

  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#D9C77A',
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 18,
    marginTop: 19,
  },

  heroButtonText: {
    color: '#101512',
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#EDEDE5',
    fontSize: 19,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#737D77',
    fontSize: 11,
    marginTop: 4,
  },

  seeAll: {
    color: '#D9C77A',
    fontSize: 12,
    fontWeight: '700',
  },

  prayerCard: {
    minHeight: 118,
    borderRadius: 23,
    backgroundColor: '#101B16',
    borderWidth: 1,
    borderColor: '#26352E',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  nextPrayerLabel: {
    color: '#78847D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  nextPrayerName: {
    color: '#F0F0E7',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 5,
  },

  nextPrayerTime: {
    color: '#B5BDB7',
    fontSize: 12,
    marginTop: 2,
  },

  countdownBox: {
    backgroundColor: '#192820',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },

  countdownLabel: {
    color: '#718078',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  countdown: {
    color: '#D9C77A',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },

  prayerRow: {
    gap: 9,
    paddingTop: 10,
  },

  prayerMiniCard: {
    width: 94,
    minHeight: 82,
    borderRadius: 17,
    backgroundColor: '#0E1814',
    borderWidth: 1,
    borderColor: '#202D27',
    padding: 12,
    justifyContent: 'space-between',
  },

  prayerMiniName: {
    color: '#D8DDD9',
    fontSize: 12,
    fontWeight: '700',
  },

  prayerMiniTime: {
    color: '#69756E',
    fontSize: 9,
  },

  quranCard: {
    minHeight: 115,
    borderRadius: 22,
    backgroundColor: '#111C17',
    borderWidth: 1,
    borderColor: '#26352E',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  quranIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#1D3027',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quranInfo: {
    flex: 1,
  },

  quranSurah: {
    color: '#E9EAE3',
    fontSize: 14,
    fontWeight: '700',
  },

  quranAyah: {
    color: '#78847D',
    fontSize: 10,
    marginTop: 4,
  },

  progressTrack: {
    height: 4,
    backgroundColor: '#26342D',
    borderRadius: 3,
    marginTop: 13,
    overflow: 'hidden',
  },

  progressFill: {
    width: '38%',
    height: 4,
    backgroundColor: '#D9C77A',
    borderRadius: 3,
  },

  progressText: {
    color: '#6E7972',
    fontSize: 9,
    marginTop: 6,
  },

  dailyRow: {
    gap: 11,
  },

  dailyCard: {
    width: 265,
    minHeight: 190,
    borderRadius: 22,
    backgroundColor: '#111C17',
    borderWidth: 1,
    borderColor: '#26352E',
    padding: 18,
  },

  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#1D3027',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  dailyLabel: {
    color: '#7D8982',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  dailyText: {
    color: '#E2E5DE',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    marginTop: 10,
  },

  dailyReference: {
    color: '#D9C77A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 13,
  },

  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  exploreCard: {
    width: '48%',
    minHeight: 125,
    borderRadius: 20,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 15,
  },

  exploreIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#1B2C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  exploreTitle: {
    color: '#E2E5DE',
    fontSize: 14,
    fontWeight: '700',
  },

  exploreSubtitle: {
    color: '#6F7973',
    fontSize: 9,
    marginTop: 4,
  },

  bottomSpace: {
    height: 80,
  },

  moreContent: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  moreTitle: {
    color: '#F0F0E7',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  moreHeaderIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreHero: {
    minHeight: 96,
    borderRadius: 23,
    backgroundColor: '#13251E',
    borderWidth: 1,
    borderColor: '#294239',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  moreHeroIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: '#1D3027',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreHeroInfo: {
    flex: 1,
    marginLeft: 14,
  },

  moreHeroTitle: {
    color: '#EDEDE5',
    fontSize: 16,
    fontWeight: '700',
  },

  moreHeroText: {
    color: '#7F8A83',
    fontSize: 10,
    marginTop: 4,
  },

  moreSectionTitle: {
    color: '#EDEDE5',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 27,
    marginBottom: 10,
  },

  moreItem: {
    minHeight: 75,
    borderRadius: 19,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  moreItemIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreItemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  moreItemTitle: {
    color: '#E4E7E0',
    fontSize: 13,
    fontWeight: '700',
  },

  moreItemSubtitle: {
    color: '#707B74',
    fontSize: 9,
    marginTop: 4,
  },

  moreVersionCard: {
    marginTop: 13,
    borderRadius: 20,
    backgroundColor: '#0D1713',
    borderWidth: 1,
    borderColor: '#202E27',
    padding: 18,
    alignItems: 'center',
  },

  moreVersionLabel: {
    color: '#66726B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  moreVersion: {
    color: '#D9C77A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 5,
  },

  moreVersionText: {
    color: '#68736C',
    fontSize: 9,
    marginTop: 4,
  },

  moreBottomSpace: {
    height: 90,
  },

  bottomNav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 67,
    borderRadius: 24,
    backgroundColor: '#111A16',
    borderWidth: 1,
    borderColor: '#29362F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },

  navItem: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  navLabel: {
    color: '#68736C',
    fontSize: 9,
    fontWeight: '600',
  },

  navLabelActive: {
    color: '#D9C77A',
  },

  placeholderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 90,
  },

  placeholderIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: '#1B2C24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  placeholderTitle: {
    color: '#F0F0E7',
    fontSize: 28,
    fontWeight: '700',
  },

  placeholderText: {
    color: '#7D8982',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 310,
  },

  backHomeButton: {
    backgroundColor: '#D9C77A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 18,
    marginTop: 24,
  },

  backHomeText: {
    color: '#101512',
    fontSize: 12,
    fontWeight: '800',
  },
});
