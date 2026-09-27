import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { usePremium } from './PremiumProvider';
import { getBookmarks } from '../quranBookmarks';
import {
  getQuranDailyGoal,
  getQuranInsights,
  getQuranProgress,
  setQuranDailyGoal,
  type QuranInsights,
} from '../quranProgress';
import {
  getLastCloudSync,
  restorePremiumData,
  syncPremiumData,
} from './cloudSyncService';
import {
  cancelAllReminders,
  getScheduledReminderCount,
  scheduleDailyIslamicReminder,
} from './reminderService';
import ThemeSelector from '../themes/ThemeSelector';
import {
  DEFAULT_QURAN_READING_SETTINGS,
  getQuranReadingSettings,
  saveQuranReadingSettings,
  type QuranReadingSettings,
} from '../quranReadingSettings';

type FeatureState = 'active' | 'available' | 'planned';

const features: Array<{
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  state: FeatureState;
}> = [
  {
    id: 'themes',
    title: 'Premium Themes',
    description: 'Exclusive appearance themes for the full app.',
    icon: 'color-palette-outline',
    state: 'active',
  },
  {
    id: 'quranAdvanced',
    title: 'Advanced Quran',
    description: 'Reading controls and Tafsir Ibn Kathir for individual Ayahs.',
    icon: 'book-outline',
    state: 'active',
  },
  {
    id: 'quranAudio',
    title: 'Quran Audio',
    description: 'Listen to Quran ayahs with the built-in player.',
    icon: 'headset-outline',
    state: 'active',
  },
  {
    id: 'bookmarks',
    title: 'Unlimited Bookmarks',
    description: 'Save and organize your Quran ayahs.',
    icon: 'bookmark-outline',
    state: 'active',
  },
  {
    id: 'duas',
    title: 'Premium Duas',
    description: 'Expanded Dua collections and saved favorites.',
    icon: 'heart-outline',
    state: 'planned',
  },
  {
    id: 'hadith',
    title: 'Premium Hadith',
    description: 'Expanded Hadith reading and collections.',
    icon: 'library-outline',
    state: 'planned',
  },
  {
    id: 'prayerAdvanced',
    title: 'Advanced Prayer',
    description: 'Additional prayer and Islamic features.',
    icon: 'time-outline',
    state: 'planned',
  },
  {
    id: 'insights',
    title: 'Reading Insights',
    description: 'Live Quran progress, bookmarks and reading stats.',
    icon: 'analytics-outline',
    state: 'active',
  },
  {
    id: 'reminders',
    title: 'Advanced Reminders',
    description: 'Real scheduled Islamic reminders on your device.',
    icon: 'notifications-outline',
    state: 'active',
  },
  {
    id: 'cloudSync',
    title: 'Cloud Sync',
    description: 'Sync supported Quran data with your Firebase account.',
    icon: 'cloud-outline',
    state: 'active',
  },
];

export default function PremiumToolsScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { isPremium } = usePremium();

  const [bookmarks, setBookmarks] = useState(0);
  const [progress, setProgress] = useState({
    surahNumber: 1,
    ayahNumber: 1,
  });
  const [sync, setSync] = useState<string | null>(null);
  const [reminders, setReminders] = useState(0);
  const [busy, setBusy] = useState(false);
  const [readingSettings, setReadingSettings] =
    useState<QuranReadingSettings>(DEFAULT_QURAN_READING_SETTINGS);
  const [quranInsights, setQuranInsights] =
    useState<QuranInsights>({
      todayCount: 0,
      dailyGoal: 10,
      currentStreak: 0,
      longestStreak: 0,
      goalCompletedToday: false,
    });

  const load = useCallback(async () => {
    setBookmarks(getBookmarks().length);

    const p = await getQuranProgress();

    if (p) {
      setProgress(p);
    }

    setSync(await getLastCloudSync());
    setReminders(await getScheduledReminderCount());
    setReadingSettings(await getQuranReadingSettings());
    setQuranInsights(await getQuranInsights());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(title + '\n\n' + message);
      return;
    }

    Alert.alert(title, message);
  };

  const run = async (
    fn: () => Promise<void>,
    successMessage: string
  ) => {
    try {
      setBusy(true);
      await fn();
      await load();
      notify('Muslim Ummah', successMessage);
    } catch (error) {
      notify(
        'Unable to complete',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isPremium) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="lock-closed"
          size={40}
          color="#D8B36A"
        />

        <Text style={styles.title}>
          Premium Required
        </Text>

        <Text style={styles.text}>
          Premium Tools contains your themes, Quran
          enhancements, insights, reminders and cloud
          features.
        </Text>

        <Pressable
          style={styles.primary}
          onPress={onBack}
        >
          <Text style={styles.primaryText}>
            Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.back}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#fff"
            />
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              Premium Tools
            </Text>

            <Text style={styles.headerSubtitle}>
              All Premium features in one place
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="sparkles"
              size={27}
              color="#D8B36A"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.heroTitle}>
              Your Premium Experience
            </Text>

            <Text style={styles.text}>
              Live features only — no dummy usage data.
            </Text>
          </View>
        </View>

        <Text style={styles.section}>
          Premium Features
        </Text>

        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              {...feature}
            />
          ))}
        </View>

        <Text style={styles.section}>
          Themes
        </Text>

        <ThemeSelector />

        <Text style={styles.section}>
          Advanced Quran
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="text-outline"
              size={24}
              color="#D8B36A"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.cardTitle}>
              Reading preferences
            </Text>
            <Text style={styles.text}>
              Change Arabic text size, line spacing and reading density.
              Settings are saved on this device.
            </Text>
          </View>
        </View>

        <Text style={styles.controlLabel}>Arabic text size</Text>
        <View style={styles.row}>
          <Pressable
            disabled={busy || readingSettings.fontSize <= 20}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  const next = {
                    ...readingSettings,
                    fontSize: Math.max(20, readingSettings.fontSize - 2),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                },
                'Quran Arabic text size decreased.'
              )
            }
          >
            <Text style={styles.actionText}>A−</Text>
          </Pressable>

          <View style={styles.valuePill}>
            <Text style={styles.valueText}>
              {readingSettings.fontSize}px
            </Text>
          </View>

          <Pressable
            disabled={busy || readingSettings.fontSize >= 36}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  const next = {
                    ...readingSettings,
                    fontSize: Math.min(36, readingSettings.fontSize + 2),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                },
                'Quran Arabic text size increased.'
              )
            }
          >
            <Text style={styles.actionText}>A+</Text>
          </Pressable>
        </View>

        <Text style={styles.controlLabel}>Line spacing</Text>
        <View style={styles.row}>
          <Pressable
            disabled={busy || readingSettings.lineSpacing <= 34}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  const next = {
                    ...readingSettings,
                    lineSpacing: Math.max(34, readingSettings.lineSpacing - 4),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                },
                'Quran line spacing reduced.'
              )
            }
          >
            <Text style={styles.actionText}>Compact</Text>
          </Pressable>

          <View style={styles.valuePill}>
            <Text style={styles.valueText}>
              {readingSettings.lineSpacing}px
            </Text>
          </View>

          <Pressable
            disabled={busy || readingSettings.lineSpacing >= 70}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  const next = {
                    ...readingSettings,
                    lineSpacing: Math.min(70, readingSettings.lineSpacing + 4),
                  };
                  await saveQuranReadingSettings(next);
                  setReadingSettings(next);
                },
                'Quran line spacing increased.'
              )
            }
          >
            <Text style={styles.actionText}>Relaxed</Text>
          </Pressable>
        </View>

        <Text style={styles.controlLabel}>Reading mode</Text>
        <View style={styles.row}>
          {(['comfortable', 'compact'] as const).map((mode) => (
            <Pressable
              key={mode}
              disabled={busy}
              style={[
                styles.modeButton,
                readingSettings.mode === mode && styles.modeButtonActive,
                busy && styles.disabled,
              ]}
              onPress={() =>
                run(
                  async () => {
                    const next = { ...readingSettings, mode };
                    await saveQuranReadingSettings(next);
                    setReadingSettings(next);
                  },
                  mode === 'comfortable'
                    ? 'Comfortable Quran reading mode enabled.'
                    : 'Compact Quran reading mode enabled.'
                )
              }
            >
              <Text
                style={[
                  styles.modeText,
                  readingSettings.mode === mode && styles.modeTextActive,
                ]}
              >
                {mode === 'comfortable' ? 'Comfortable' : 'Compact'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>
          Reading Insights
        </Text>

        <View style={styles.statsGrid}>
          <Stat
            icon="bookmark-outline"
            label="Saved Ayahs"
            value={bookmarks}
          />

          <Stat
            icon="book-outline"
            label="Current Surah"
            value={progress.surahNumber}
          />

          <Stat
            icon="flag-outline"
            label="Current Ayah"
            value={progress.ayahNumber}
          />
        </View>

        <Text style={styles.section}>
          Reading Goals & Streak
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="flame-outline"
              size={24}
              color="#D8B36A"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.cardTitle}>
              Daily Quran goal
            </Text>

            <Text style={styles.text}>
              {quranInsights.goalCompletedToday
                ? 'Goal completed today. MashaAllah!'
                : quranInsights.todayCount +
                  ' / ' +
                  quranInsights.dailyGoal +
                  ' unique Ayahs read today.'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <Stat
            icon="book-outline"
            label="Today"
            value={quranInsights.todayCount}
          />

          <Stat
            icon="flame-outline"
            label="Current Streak"
            value={quranInsights.currentStreak}
          />

          <Stat
            icon="trophy-outline"
            label="Best Streak"
            value={quranInsights.longestStreak}
          />
        </View>

        <Text style={styles.controlLabel}>
          Daily goal: {quranInsights.dailyGoal} Ayahs
        </Text>

        <View style={styles.row}>
          <Pressable
            disabled={busy || quranInsights.dailyGoal <= 1}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  await setQuranDailyGoal(
                    quranInsights.dailyGoal - 5
                  );
                },
                'Daily Quran goal reduced.'
              )
            }
          >
            <Text style={styles.actionText}>−5</Text>
          </Pressable>

          <View style={styles.valuePill}>
            <Text style={styles.valueText}>
              {quranInsights.dailyGoal} Ayahs
            </Text>
          </View>

          <Pressable
            disabled={busy || quranInsights.dailyGoal >= 100}
            style={[styles.action, busy && styles.disabled]}
            onPress={() =>
              run(
                async () => {
                  await setQuranDailyGoal(
                    quranInsights.dailyGoal + 5
                  );
                },
                'Daily Quran goal increased.'
              )
            }
          >
            <Text style={styles.actionText}>+5</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>
          Cloud Sync
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="cloud-outline"
              size={24}
              color="#D8B36A"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.cardTitle}>
              Sync Quran progress & bookmarks
            </Text>

            <Text style={styles.text}>
              {sync
                ? 'Last sync: ' +
                  new Date(sync).toLocaleString()
                : 'Not synced yet'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Pressable
            disabled={busy}
            style={[
              styles.action,
              busy && styles.disabled,
            ]}
            onPress={() =>
              run(
                syncPremiumData,
                'Your Quran data was synced to Firebase.'
              )
            }
          >
            <Text style={styles.actionText}>
              Sync Now
            </Text>
          </Pressable>

          <Pressable
            disabled={busy}
            style={[
              styles.action,
              busy && styles.disabled,
            ]}
            onPress={async () => {
              try {
                setBusy(true);

                const data =
                  await restorePremiumData();

                notify(
                  'Cloud Sync',
                  data
                    ? 'Cloud data found: ' +
                        data.bookmarks.length +
                        ' bookmarks.'
                    : 'No cloud data found.'
                );
              } catch (error) {
                notify(
                  'Cloud Sync',
                  error instanceof Error
                    ? error.message
                    : 'Unable to check cloud data.'
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Text style={styles.actionText}>
              Check Cloud
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>
          Advanced Reminders
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#D8B36A"
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.cardTitle}>
              Daily Islamic reminder
            </Text>

            <Text style={styles.text}>
              {reminders} scheduled notification(s)
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Pressable
            disabled={busy}
            style={[
              styles.action,
              busy && styles.disabled,
            ]}
            onPress={() =>
              run(
                async () => {
                  await scheduleDailyIslamicReminder(
                    9,
                    0
                  );
                },
                'Daily reminder scheduled for 9:00 AM.'
              )
            }
          >
            <Text style={styles.actionText}>
              Schedule 9 AM
            </Text>
          </Pressable>

          <Pressable
            disabled={busy}
            style={[
              styles.danger,
              busy && styles.disabled,
            ]}
            onPress={() =>
              run(
                cancelAllReminders,
                'All scheduled reminders cancelled.'
              )
            }
          >
            <Text style={styles.dangerText}>
              Cancel All
            </Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#D8B36A"
          />

          <Text style={styles.text}>
            Themes, Advanced Quran, Insights, Quran Audio,
            Bookmarks, Reminders and Cloud Sync are connected
            to real app functionality. Dua, Hadith and
            Advanced Prayer are listed here but their
            dedicated premium modules still need their
            real data/functionality wired in.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  state,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  state: FeatureState;
}) {
  const stateLabel =
    state === 'active'
      ? 'ACTIVE'
      : state === 'available'
      ? 'AVAILABLE'
      : 'MODULE PENDING';

  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#D8B36A"
        />
      </View>

      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>

        <View
          style={[
            styles.status,
            state === 'planned'
              ? styles.statusPending
              : styles.statusActive,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              state === 'planned'
                ? styles.statusDotPending
                : styles.statusDotActive,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              state === 'planned'
                ? styles.statusTextPending
                : styles.statusTextActive,
            ]}
          >
            {stateLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons
        name={icon}
        size={22}
        color="#D8B36A"
      />

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    backgroundColor: '#080A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#151922',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#858B99',
    fontSize: 10,
    marginTop: 2,
  },

  hero: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#292E39',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
  },

  text: {
    color: '#858B99',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  section: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 25,
    marginBottom: 10,
  },

  featureGrid: {
    gap: 9,
  },

  featureCard: {
    padding: 13,
    borderRadius: 18,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
    flexDirection: 'row',
    gap: 12,
  },

  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureInfo: {
    flex: 1,
  },

  featureTitle: {
    color: '#eee',
    fontSize: 12,
    fontWeight: '800',
  },

  featureDescription: {
    color: '#858B99',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  status: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
  },

  statusActive: {
    backgroundColor: '#17251E',
  },

  statusPending: {
    backgroundColor: '#241D16',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusDotActive: {
    backgroundColor: '#74C69D',
  },

  statusDotPending: {
    backgroundColor: '#D8B36A',
  },

  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },

  statusTextActive: {
    color: '#8DD8B0',
  },

  statusTextPending: {
    color: '#D8B36A',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  stat: {
    flex: 1,
    minHeight: 105,
    padding: 13,
    borderRadius: 17,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
  },

  statLabel: {
    color: '#7B828F',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 12,
  },

  statValue: {
    color: '#D8B36A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },

  card: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flex: {
    flex: 1,
  },

  cardTitle: {
    color: '#eee',
    fontSize: 12,
    fontWeight: '800',
  },

  controlLabel: {
    color: '#9DA1AE',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 13,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  valuePill: {
    flex: 1,
    minWidth: 70,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  valueText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#10131A',
    borderWidth: 1,
    borderColor: '#252A35',
    alignItems: 'center',
  },

  modeButtonActive: {
    backgroundColor: '#211F18',
    borderColor: '#806B3D',
  },

  modeText: {
    color: '#858B99',
    fontSize: 10,
    fontWeight: '800',
  },

  modeTextActive: {
    color: '#D8B36A',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },

  action: {
    flex: 1,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#806B3D',
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.5,
  },

  actionText: {
    color: '#D8B36A',
    fontSize: 10,
    fontWeight: '900',
  },

  danger: {
    flex: 1,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#241417',
    borderWidth: 1,
    borderColor: '#663038',
    alignItems: 'center',
  },

  dangerText: {
    color: '#E9A5AB',
    fontSize: 10,
    fontWeight: '900',
  },

  primary: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#D8B36A',
  },

  primaryText: {
    color: '#080A0F',
    fontWeight: '900',
  },

  note: {
    marginTop: 20,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#252A35',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  bottomSpace: {
    height: 30,
  },
});
