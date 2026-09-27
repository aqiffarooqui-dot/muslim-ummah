import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrayerCalculationMethod = {
  id: number;
  name: string;
};

export type PrayerSettings = {
  method: number;
  school: 0 | 1;
};

export const PRAYER_METHODS: PrayerCalculationMethod[] = [
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 2, name: 'Islamic Society of North America' },
  { id: 3, name: 'Muslim World League' },
  { id: 4, name: 'Umm Al-Qura University, Makkah' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
];

const KEY = '@muslim_ummah_prayer_settings_v1';

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  method: 1,
  school: 1,
};

export async function getPrayerSettings(): Promise<PrayerSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRAYER_SETTINGS;
    const parsed = JSON.parse(raw);
    const method = Number(parsed?.method);
    const school = Number(parsed?.school);
    return {
      method: PRAYER_METHODS.some(x => x.id === method)
        ? method
        : DEFAULT_PRAYER_SETTINGS.method,
      school: school === 0 ? 0 : 1,
    };
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export async function savePrayerSettings(settings: PrayerSettings) {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
