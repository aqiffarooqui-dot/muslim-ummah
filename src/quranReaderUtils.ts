import {
  QuranReaderLineStyle,
  QuranReaderStyle,
} from './quranReaderConfig';

export type QuranDisplaySettings = {
  readerStyle: QuranReaderStyle;
  lineStyle: QuranReaderLineStyle;
  arabicFontSize: number;
  arabicLineHeight: number;
};

export const DEFAULT_QURAN_DISPLAY_SETTINGS: QuranDisplaySettings = {
  readerStyle: 'indopak',
  lineStyle: 'standard',
  arabicFontSize: 25,
  arabicLineHeight: 48,
};

export function getArabicTextStyle(
  settings: QuranDisplaySettings
) {
  if (settings.readerStyle === 'indopak') {
    return {
      fontSize: settings.arabicFontSize,
      lineHeight: settings.arabicLineHeight,
      textAlign: 'right' as const,
      writingDirection: 'rtl' as const,
      includeFontPadding: true,
    };
  }

  return {
    fontSize: settings.arabicFontSize,
    lineHeight: settings.arabicLineHeight,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    includeFontPadding: true,
  };
}

export function getLineStyleDescription(
  lineStyle: QuranReaderLineStyle
): string {
  switch (lineStyle) {
    case '15_lines':
      return '15-line Indo-Pak style';

    case '16_lines':
      return '16-line Indo-Pak style';

    default:
      return 'Standard mobile reading';
  }
}
