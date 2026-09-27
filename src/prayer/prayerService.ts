import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  timezone?: string;
  sunset?: string;
  sunsetMinutes?: number;
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
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
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

const CACHE_PREFIX = '@muslim_ummah_prayer_cache_v2_';

function prayerCacheKey(
  date: Date,
  method: number,
  school: number,
  latitude: number,
  longitude: number
): string {
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  return `${CACHE_PREFIX}${getDateString(date)}_${method}_${school}_${lat}_${lon}`;
}

async function readPrayerCache(
  date: Date,
  method: number,
  school: number,
  latitude: number,
  longitude: number
): Promise<PrayerData | null> {
  try {
    const raw = await AsyncStorage.getItem(
      prayerCacheKey(date, method, school, latitude, longitude)
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw) as PrayerData;

    if (
      !parsed ||
      !Array.isArray(parsed.prayers) ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function writePrayerCache(
  date: Date,
  method: number,
  school: number,
  data: PrayerData
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      prayerCacheKey(
        date,
        method,
        school,
        data.latitude,
        data.longitude
      ),
      JSON.stringify(data)
    );
  } catch {
    // Cache is only an offline safety net.
  }
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

    if (
      place?.city ||
      place?.district ||
      place?.subregion ||
      place?.region
    ) {
      city =
        place.city ||
        place.district ||
        place.subregion ||
        place.region ||
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
  const date = new Date();
  const settings = await getPrayerSettings();

  const location = await getCoordinates();

  try {
    const dateString = getDateString(date);

    const url =
      `${API_BASE}/timings/${dateString}` +
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

    const data: PrayerData = {
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
      timezone: json.data.meta?.timezone,
      sunset: json.data.timings.Sunset
        ? formatTime(json.data.timings.Sunset)
        : undefined,
      sunsetMinutes: json.data.timings.Sunset
        ? toMinutes(json.data.timings.Sunset)
        : undefined,
    };

    await writePrayerCache(
      date,
      settings.method,
      settings.school,
      data
    );

    return data;
  } catch (error) {
    console.warn(
      'Prayer API loading failed:',
      error
    );

    const cached = await readPrayerCache(
      date,
      settings.method,
      settings.school,
      location.latitude,
      location.longitude
    );

    if (cached) {
      return cached;
    }

    throw error;
  }
}

export function getNextPrayer(
  prayers: PrayerTime[],
  now = new Date()
) {
  const currentSeconds =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

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

export function getCurrentPrayerWindow(
  prayers: PrayerTime[],
  now = new Date()
) {
  const currentSeconds =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

  const obligatory = prayers.filter(
    (prayer) =>
      prayer.key !== 'Sunrise'
  );

  for (let index = 0; index < obligatory.length; index += 1) {
    const current = obligatory[index];
    const next = obligatory[index + 1];

    const start = current.minutes * 60;
    const end =
      next?.minutes * 60 ??
      (24 * 60 * 60 +
        (obligatory[0]?.minutes ?? 0) * 60);

    const normalizedCurrent =
      current.key === 'Isha' &&
      currentSeconds < (obligatory[0]?.minutes ?? 0) * 60
        ? currentSeconds + 24 * 60 * 60
        : currentSeconds;

    if (
      normalizedCurrent >= start &&
      normalizedCurrent < end
    ) {
      return {
        name: current.name,
        key: current.key,
        endsAtMinutes:
          next?.minutes ??
          (obligatory[0]?.minutes ?? 0),
        remainingSeconds:
          end - normalizedCurrent,
      };
    }
  }

  return null;
}

export function getOptionalPrayerWindows(
  prayers: PrayerTime[]
) {
  const sunrise =
    prayers.find(
      (prayer) => prayer.key === 'Sunrise'
    )?.minutes;

  const dhuhr =
    prayers.find(
      (prayer) => prayer.key === 'Dhuhr'
    )?.minutes;

  if (
    sunrise === undefined ||
    dhuhr === undefined
  ) {
    return null;
  }

  const ishraqStart = sunrise + 20;
  const chashtStart = sunrise + 20;
  const chashtEnd = Math.max(
    chashtStart,
    dhuhr - 10
  );

  return {
    ishraqStart,
    chashtStart,
    chashtEnd,
    zawalStart: dhuhr - 10,
    dhuhr,
  };
}

export function getNightWindow(
  prayers: PrayerTime[],
  sunsetMinutes?: number
) {
  const maghrib =
    prayers.find(
      (prayer) => prayer.key === 'Maghrib'
    )?.minutes;

  const fajr =
    prayers.find(
      (prayer) => prayer.key === 'Fajr'
    )?.minutes;

  const isha =
    prayers.find(
      (prayer) => prayer.key === 'Isha'
    )?.minutes;

  const nightStart = sunsetMinutes ?? maghrib;

  if (
    nightStart === undefined ||
    fajr === undefined ||
    isha === undefined
  ) {
    return null;
  }

  const nextFajr = fajr + 24 * 60;
  const nightLength = nextFajr - nightStart;
  const lastThirdStart =
    Math.round(
      nightStart + (nightLength * 2) / 3
    ) % (24 * 60);

  return {
    maghrib: nightStart,
    isha,
    nightStart,
    nightEnd: nextFajr,
    midnight:
      Math.round(
        nightStart + nightLength / 2
      ) % (24 * 60),
    lastThirdStart,
    lastThirdEnd: fajr,
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
