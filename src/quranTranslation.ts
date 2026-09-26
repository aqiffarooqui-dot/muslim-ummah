export type QuranLanguage = 'arabic' | 'urdu' | 'hinglish' | 'english';

export type QuranTranslation = {
  surahNumber: number;
  ayahNumber: number;
  text: string;
};

export type TranslationMap = Record<
  string,
  Record<number, string>
>;

export function createTranslationMap(
  translations: QuranTranslation[]
): TranslationMap {
  const map: TranslationMap = {};

  for (const item of translations) {
    if (!map[item.surahNumber]) {
      map[item.surahNumber] = {};
    }

    map[item.surahNumber][item.ayahNumber] = item.text;
  }

  return map;
}

export function getTranslation(
  map: TranslationMap,
  surahNumber: number,
  ayahNumber: number
): string {
  return map[surahNumber]?.[ayahNumber] ?? '';
}
