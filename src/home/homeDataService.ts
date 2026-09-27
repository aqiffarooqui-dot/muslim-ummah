import type { PrayerData } from '../prayer/prayerService';

export type DailyHadith = {
  book: string;
  hadithNumber: string;
  reference: string;
  arabic: string;
  english: string;
  romanUrdu: string;
};

export type LiveWeather = {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
};

const HADITH_BOOKS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', sections: 97 },
  { id: 'muslim', name: 'Sahih Muslim', sections: 56 },
  { id: 'abudawud', name: 'Sunan Abi Dawud', sections: 43 },
  { id: 'tirmidhi', name: 'Jami at-Tirmidhi', sections: 49 },
  { id: 'nasai', name: "Sunan an-Nasa'i", sections: 52 },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', sections: 37 },
] as const;

const HADITH_BASE =
  'https://raw.githubusercontent.com/HsnSaboor/hadith-api-toon/main/editions';

function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor(
    (date.getTime() - start.getTime()) / 86400000
  );
}

function parseToonRow(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  values.push(value);
  return values;
}

function firstToonRow(content: string): string[] | null {
  const headerEnd = content.indexOf('\\n');
  if (headerEnd < 0) return null;

  let row = '';
  let quoted = false;

  for (let i = headerEnd + 1; i < content.length; i += 1) {
    const char = content[i];

    if (char === '"') {
      if (quoted && content[i + 1] === '"') {
        row += '""';
        i += 1;
        continue;
      }

      quoted = !quoted;
      row += char;
      continue;
    }

    if (char === '\\r' && content[i + 1] === '\\n' && !quoted) {
      break;
    }

    row += char;
  }

  return row.trim() ? parseToonRow(row) : null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Daily Hadith source unavailable');
  }

  return response.text();
}

export async function getDailyHadith(): Promise<DailyHadith> {
  const index = dayOfYear() - 1;
  const book = HADITH_BOOKS[index % HADITH_BOOKS.length];
  const section =
    (Math.floor(index / HADITH_BOOKS.length) % book.sections) + 1;

  const [arabicContent, englishContent, romanContent] =
    await Promise.all([
      fetchText(
        `${HADITH_BASE}/${book.id}/sections/${section}.toon`
      ),
      fetchText(
        `${HADITH_BASE}/${book.id}/translations/en/sections/${section}.toon`
      ),
      fetchText(
        `${HADITH_BASE}/${book.id}/translations/roman-ur/sections/${section}.toon`
      ),
    ]);

  const arabicRow = firstToonRow(arabicContent);
  const englishRow = firstToonRow(englishContent);
  const romanRow = firstToonRow(romanContent);

  if (!arabicRow || !englishRow || !romanRow) {
    throw new Error('Daily Hadith data is incomplete');
  }

  return {
    book: book.name,
    hadithNumber: arabicRow[0] || englishRow[0] || romanRow[0] || '',
    arabic: arabicRow[1] || '',
    reference: arabicRow[3] || `${book.name} • Hadith ${arabicRow[0] || ''}`,
    english: englishRow[1] || '',
    romanUrdu: romanRow[1] || '',
  };
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Current conditions';
}

export function getWeatherLabel(code: number): string {
  return weatherLabel(code);
}

export async function getLiveWeather(
  prayerData: PrayerData
): Promise<LiveWeather> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${prayerData.latitude}` +
    `&longitude=${prayerData.longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m' +
    '&daily=sunrise,sunset' +
    '&forecast_days=1' +
    '&timezone=auto';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Weather service unavailable');
  }

  const json = await response.json();

  return {
    temperature: Number(json.current?.temperature_2m ?? 0),
    apparentTemperature: Number(json.current?.apparent_temperature ?? 0),
    weatherCode: Number(json.current?.weather_code ?? 0),
    isDay: Number(json.current?.is_day ?? 0) === 1,
    humidity: Number(json.current?.relative_humidity_2m ?? 0),
    windSpeed: Number(json.current?.wind_speed_10m ?? 0),
    sunrise: String(json.daily?.sunrise?.[0] ?? ''),
    sunset: String(json.daily?.sunset?.[0] ?? ''),
  };
}
