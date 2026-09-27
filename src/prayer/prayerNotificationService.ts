import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getTodayPrayerData,
  getPrayerTimesForDateAtLocation,
  type PrayerTime,
} from './prayerService';
import {
  getPrayerNotificationSettings,
  PRAYER_NOTIFICATION_KEYS,
  type PrayerNotificationSettings,
} from './prayerNotificationSettings';

const IDS_KEY = '@muslim_ummah_prayer_notification_ids_v1';
const CHANNEL_ID = 'prayer-times';
const DAYS_TO_SCHEDULE = 7;

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function cancelOwnedNotifications(): Promise<void> {
  const raw = await AsyncStorage.getItem(IDS_KEY);
  if (!raw) return;

  try {
    const ids = JSON.parse(raw) as string[];
    await Promise.all(
      ids.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)
      )
    );
  } finally {
    await AsyncStorage.removeItem(IDS_KEY);
  }
}

function dateForPrayer(day: Date, prayer: PrayerTime): Date {
  const date = new Date(day);
  date.setHours(
    Math.floor(prayer.minutes / 60),
    prayer.minutes % 60,
    0,
    0
  );
  return date;
}

function nextLocalDay(base: Date, offset: number): Date {
  const date = new Date(base);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

export async function schedulePrayerNotifications(
  settings?: PrayerNotificationSettings
): Promise<number> {
  if (Platform.OS === 'web') {
    throw new Error('Prayer notifications are available on Android and iOS devices.');
  }

  const effective =
    settings ?? (await getPrayerNotificationSettings());

  await cancelOwnedNotifications();

  if (!effective.enabled) return 0;

  if (!(await requestPermission())) {
    throw new Error('Notification permission was not granted.');
  }

  const today = await getTodayPrayerData();
  const now = new Date();
  const ids: string[] = [];

  for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset += 1) {
    const day = nextLocalDay(now, dayOffset);

    const prayers =
      dayOffset === 0
        ? today.prayers
        : await getPrayerTimesForDateAtLocation(
            day,
            today.latitude,
            today.longitude
          );

    for (const prayer of prayers) {
      if (!PRAYER_NOTIFICATION_KEYS.includes(prayer.key as typeof PRAYER_NOTIFICATION_KEYS[number])) {
        continue;
      }

      if (!effective.prayers[prayer.key as keyof typeof effective.prayers]) {
        continue;
      }

      const triggerDate = dateForPrayer(day, prayer);

      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: prayer.name + ' Prayer',
          body: "It's time for " + prayer.name + ' prayer.',
          sound: 'default',
          data: {
            type: 'prayer',
            prayer: prayer.key,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...(Platform.OS === 'android'
            ? { channelId: CHANNEL_ID }
            : {}),
        },
      });

      ids.push(id);
    }
  }

  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids));
  return ids.length;
}

export async function cancelPrayerNotifications(): Promise<void> {
  await cancelOwnedNotifications();
}

export async function getScheduledPrayerNotificationCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(IDS_KEY);
  if (!raw) return 0;

  try {
    return (JSON.parse(raw) as string[]).length;
  } catch {
    return 0;
  }
}
