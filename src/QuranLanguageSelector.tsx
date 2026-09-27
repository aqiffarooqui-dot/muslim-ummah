import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from './themes/ThemeProvider';
import { createThemedStyles } from './themes/themeStyleMapper';

import {
  QuranLanguage,
} from './quranTranslation';

import {
  QURAN_LANGUAGES,
} from './quranTranslations';

type QuranLanguageSelectorProps = {
  selectedLanguage: QuranLanguage;
  onLanguageChange: (language: QuranLanguage) => void;
};

export default function QuranLanguageSelector({
  selectedLanguage,
  onLanguageChange,
}: QuranLanguageSelectorProps) {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme, rawStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Translation</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {QURAN_LANGUAGES.map((language) => {
          const active = language.id === selectedLanguage;

          return (
            <Pressable
              key={language.id}
              onPress={() => onLanguageChange(language.id)}
              style={[
                styles.chip,
                active && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                ]}
              >
                {language.label}
              </Text>

              <Text
                style={[
                  styles.nativeLabel,
                  active && styles.nativeLabelActive,
                ]}
              >
                {language.nativeLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const rawStyles = {
  container: {
    marginTop: 18,
    marginBottom: 8,
  },

  title: {
    color: '#8F94A3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 9,
  },

  row: {
    gap: 9,
    paddingRight: 10,
  },

  chip: {
    minWidth: 82,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#141821',
    borderWidth: 1,
    borderColor: '#282D38',
  },

  chipActive: {
    backgroundColor: '#D8B36A',
    borderColor: '#D8B36A',
  },

  label: {
    color: '#B0B4C0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  labelActive: {
    color: '#101114',
  },

  nativeLabel: {
    color: '#777C8B',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },

  nativeLabelActive: {
    color: '#39301F',
  },
};
