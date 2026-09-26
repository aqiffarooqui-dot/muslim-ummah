import { SURAHS, Surah } from './QuranData';

export type QuranAyah = {
  number: number;
  text: string;
};

export type QuranSurah = Surah & {
  ayahs: QuranAyah[];
};

export function parseQuranText(text: string): QuranSurah[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const surahs: QuranSurah[] = [];
  let currentSurahNumber = 0;
  let currentAyahNumber = 0;

  for (const line of lines) {
    const parts = line.split('|');

    if (parts.length < 3) {
      continue;
    }

    const surahNumber = Number(parts[0]);
    const ayahNumber = Number(parts[1]);
    const ayahText = parts.slice(2).join('|').trim();

    if (
      !Number.isInteger(surahNumber) ||
      !Number.isInteger(ayahNumber) ||
      !ayahText
    ) {
      continue;
    }

    if (surahNumber !== currentSurahNumber) {
      const surahInfo = SURAHS.find(
        (surah) => surah.number === surahNumber
      );

      if (!surahInfo) {
        continue;
      }

      surahs.push({
        ...surahInfo,
        ayahs: [],
      });

      currentSurahNumber = surahNumber;
      currentAyahNumber = 0;
    }

    const currentSurah = surahs[surahs.length - 1];

    if (!currentSurah) {
      continue;
    }

    if (ayahNumber !== currentAyahNumber + 1) {
      currentAyahNumber = ayahNumber;
    } else {
      currentAyahNumber = ayahNumber;
    }

    currentSurah.ayahs.push({
      number: ayahNumber,
      text: ayahText,
    });
  }

  return surahs;
}
