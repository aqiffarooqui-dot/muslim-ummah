import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

import {
  DEFAULT_QURAN_DISPLAY_SETTINGS,
  getArabicTextStyle,
} from './quranReaderUtils';

import { getQuranArabicFontFamily } from './quranFont';

type QuranArabicTextProps = {
  children: string;
  style?: TextStyle | TextStyle[];
};

export default function QuranArabicText({
  children,
  style,
}: QuranArabicTextProps) {
  const arabicStyle = getArabicTextStyle(
    DEFAULT_QURAN_DISPLAY_SETTINGS
  );

  return (
    <Text
      style={[
        styles.base,
        arabicStyle,
        {
          fontFamily: getQuranArabicFontFamily(),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: '#F2EBDD',
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: true,
  },
});
