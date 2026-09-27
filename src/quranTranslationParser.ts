import {
  QuranTranslation,
  createTranslationMap,
  TranslationMap,
} from './quranTranslation';
import { SURAHS } from './QuranData';

export function parseTranslationText(text: string): TranslationMap {
  const lines = text.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
  const translations: QuranTranslation[] = [];
  const hasExplicitKeys = lines.some((line) => line.split('|').length >= 3);

  if (hasExplicitKeys) {
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 3) continue;
      const surahNumber = Number(parts[0]);
      const ayahNumber = Number(parts[1]);
      const translation = parts.slice(2).join('|').trim();
      if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber) || !translation) continue;
      translations.push({ surahNumber, ayahNumber, text: translation });
    }
  } else {
    let lineIndex = 0;
    for (const surah of SURAHS) {
      for (let ayahNumber = 1; ayahNumber <= surah.ayahCount; ayahNumber += 1) {
        const translation = lines[lineIndex]?.trim();
        lineIndex += 1;
        if (translation) translations.push({ surahNumber: surah.number, ayahNumber, text: translation });
      }
    }
  }

  return createTranslationMap(translations);
}
