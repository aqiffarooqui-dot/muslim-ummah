import {
  QuranTranslation,
  createTranslationMap,
  TranslationMap,
} from './quranTranslation';

export function parseTranslationText(text: string): TranslationMap {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const translations: QuranTranslation[] = [];

  for (const line of lines) {
    const parts = line.split('|');

    if (parts.length < 3) {
      continue;
    }

    const surahNumber = Number(parts[0]);
    const ayahNumber = Number(parts[1]);
    const translation = parts.slice(2).join('|').trim();

    if (
      !Number.isInteger(surahNumber) ||
      !Number.isInteger(ayahNumber) ||
      !translation
    ) {
      continue;
    }

    translations.push({
      surahNumber,
      ayahNumber,
      text: translation,
    });
  }

  return createTranslationMap(translations);
}
