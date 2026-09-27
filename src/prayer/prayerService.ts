import * as Location from 'expo-location';
import { getPrayerSettings } from './prayerSettings';

export type PrayerKey =
  | 'Fajr'
  | 'Sunrise'
  | 'Dhuhr'
  | 'Asr'
  | 'Maghrib'
  | 'Isha';

export type PrayerTime = {
  key: PrayerKey;
  name: string;
  time: string;
  minutes: number;
};

export type PrayerData = {
  city: string;
  country: string;
  hijriDate: string;
  prayers: PrayerTime[];
  latitude: number;
  longitude: number;
};

type AlAdhanResponse = {
  code: number;
  data?: {
    date?: {
      readable?: string;
      hijri?: {
        day?: string;
        month?: { en?: string };
        year?: string;
      };
    };
    meta?: {
      timezone?: string;
    };
    timings?: Record<string, string>;
  };
};

const API_BASE = 'https://api.aladhan.com/v1';
const INDIA_METHOD = 1;
const DEFAULT_LATITUDE = 28.6139;
const DEFAULT_LONGITUDE = 77.2090;

function getDateString(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function toMinutes(value: string) {
  const match = value.match(/(\\d{1,2}):(\\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(value: string) {
  const match = value.match(/(\\d{1,2}):(\\d{2})/);
  if (!match) return value;

  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${String(hour).padStart(2, '0')}:${minute} ${suffix}`;
}

function buildPrayerList(timings: Record<string, string>): PrayerTime[] {
  const keys: Array<[PrayerKey, string]> = [
    ['Fajr', 'Fajr'],
    ['Sunrise', 'Sunrise'],
    ['Dhuhr', 'Dhuhr'],
    ['Asr', 'Asr'],
    ['Maghrib', 'Maghrib'],
    ['Isha', 'Isha'],
  ];

  return keys
    .filter(([, apiKey]) => Boolean(timings[apiKey]))
    .map(([key, apiKey]) => ({
      key,
      name: key,
      time: formatTime(timings[apiKey]),
      minutes: toMinutes(timings[apiKey]),
    }));
}

function fallbackPrayerData(): PrayerData {
  const fallback = {
    Fajr: '05:02',
    Sunrise: '06:20',
    Dhuhr: '12:18',
    Asr: '16:42',
    Maghrib: '18:29',
    Isha: '19:48',
  };

  return {
    city: 'New Delhi',
    country: 'India',
    hijriDate: '',
    prayers: buildPrayerList(fallback),
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
  };
}

async function getCoordinates() {
  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error(
      'Location permission is required to calculate prayer times for your current location.'
    );
  }

  try {
    const servicesEnabled =
      await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      await Location.enableNetworkProviderAsync();
    }
  } catch {
    // Continue to get the best available fix.
  }

  const lastKnown =
    await Location.getLastKnownPositionAsync({
      maxAge: 5 * 60 * 1000,
      requiredAccuracy: 5000,
    });

  let position = lastKnown;

  try {
    position =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
  } catch (error) {
    if (!position) {
      throw error;
    }
  }

  if (!position) {
    throw new Error(
      'Unable to determine the current device location.'
    );
  }

  let city = 'Current location';
  let country = '';

  try {
    const places =
      await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

    const place = places[0];

    if (place?.city || place?.district) {
      city =
        place.city ||
        place.district ||
        'Current location';
    }

    country = place?.country || '';
  } catch {
    // Coordinates are still usable if reverse geocoding fails.
  }

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    city,
    country,
  };
}

export async function getPrayerTimesForDateAtLocation(
  date: Date,
  latitude: number,
  longitude: number
): Promise<PrayerTime[]> {
  const settings = await getPrayerSettings();
  const url =
    `${API_BASE}/timings/${getDateString(date)}` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&method=${settings.method}` +
    `&school=${settings.school}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Prayer API returned ${response.status}`
    );
  }

  const json =
    (await response.json()) as AlAdhanResponse;

  if (
    json.code !== 200 ||
    !json.data?.timings
  ) {
    throw new Error('Prayer API returned invalid data');
  }

  return buildPrayerList(json.data.timings);
}

export async function getTodayPrayerData(): Promise<PrayerData> {
  try {
    const location = await getCoordinates();
    const date = getDateString();
    const settings = await getPrayerSettings();

    const url =
      `${API_BASE}/timings/${date}` +
      `?latitude=${location.latitude}` +
      `&longitude=${location.longitude}` +
      `&method=${settings.method}` +
      `&school=${settings.school}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Prayer API returned ${response.status}`
      );
    }

    const json =
      (await response.json()) as AlAdhanResponse;

    if (
      json.code !== 200 ||
      !json.data?.timings
    ) {
      throw new Error('Prayer API returned invalid data');
    }

    const hijri = json.data.date?.hijri;

    return {
      city: location.city,
      country: location.country,
      hijriDate:
        hijri?.day &&
        hijri.month?.en &&
        hijri.year
          ? `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
          : '',
      prayers: buildPrayerList(json.data.timings),
      latitude: location.latitude,
      longitude: location.longitude,
    };
  } catch (error) {
    console.warn(
      'Prayer data loading failed:',
      error
    );

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('location')
    ) {
      throw error;
    }

    return fallbackPrayerData();
  }
}

export function getNextPrayer(
  prayers: PrayerTime[],
  now = new Date()
) {
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const currentSeconds =
    currentMinutes * 60 + now.getSeconds();

  const next =
    prayers.find(
      (prayer) =>
        prayer.key !== 'Sunrise' &&
        prayer.minutes * 60 > currentSeconds
    ) ||
    prayers.find(
      (prayer) => prayer.key === 'Fajr'
    );

  if (!next) return null;

  let targetSeconds =
    next.minutes * 60;

  if (
    next.key === 'Fajr' &&
    targetSeconds <= currentSeconds
  ) {
    targetSeconds += 24 * 60 * 60;
  }

  let remaining =
    targetSeconds - currentSeconds;

  if (remaining < 0) {
    remaining += 24 * 60 * 60;
  }

  return {
    ...next,
    remainingSeconds: remaining,
  };
}

export function formatCountdown(
  totalSeconds: number
) {
  const safe = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor(
    (safe % 3600) / 60
  );
  const seconds = safe % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}
