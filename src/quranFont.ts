export const QURAN_ARABIC_FONT_FAMILY = 'QuranIndoPak';

export const QURAN_ARABIC_FONT = {
  family: QURAN_ARABIC_FONT_FAMILY,

  fallback: 'serif',

  isBundled: false,
};

export function getQuranArabicFontFamily(): string {
  return QURAN_ARABIC_FONT.isBundled
    ? QURAN_ARABIC_FONT.family
    : QURAN_ARABIC_FONT.fallback;
}
