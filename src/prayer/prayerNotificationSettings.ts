import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrayerNotificationSettings = {
  enabled: boolean;
  prayers: Record<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', boolean>;
};

export const DEFAULT_PRAYER_NOTIFICATION_SETTINGS: PrayerNotificationSettings = {
  enabled: false,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

const KEY = '@muslim_ummah_prayer_notifications_v1';

export async function getPrayerNotificationSettings(): Promise<PrayerNotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRAYER_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed?.enabled === true,
      prayers: {
        Fajr: parsed?.prayers?.Fajr !== false,
        Dhuhr: parsed?.prayers?.Dhuhr !== false,
        Asr: parsed?.prayers?.Asr !== false,
        Maghrib: parsed?.prayers?.Maghrib !== false,
        Isha: parsed?.prayers?.Isha !== false,
      },
    };
  } catch {
    return DEFAULT_PRAYER_NOTIFICATION_SETTINGS;
  }
}

export async function savePrayerNotificationSettings(
  settings: PrayerNotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

export const PRAYER_NOTIFICATION_KEYS = [
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
] as const;
