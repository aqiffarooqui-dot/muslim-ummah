import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Alert, Platform } from 'react-native';
import { usePremium } from './premium/PremiumProvider';
import { useTheme } from './themes/ThemeProvider';
import { createThemedStyles } from './themes/themeStyleMapper';
import { DEFAULT_QURAN_READING_SETTINGS } from './quranReadingSettings';

import QuranArabicText from './QuranArabicText';

type QuranAyahCardProps = {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation?: string;
  isUrdu?: boolean;
  bookmarked?: boolean;
  onBookmarkPress?: () => void;
  onPlayAyah?: () => void;
  fontSize?: number;
  lineSpacing?: number;
};

export default function QuranAyahCard({
  surahNumber,
  ayahNumber,
  arabicText,
  translation,
  isUrdu = false,
  bookmarked = false,
  onBookmarkPress,
  onPlayAyah,
  fontSize,
  lineSpacing,
}: QuranAyahCardProps) {
  const { isPremium } = usePremium();
  const { theme } = useTheme();
  const styles = createThemedStyles(theme, rawStyles);
  const [readingSettings] = useState(DEFAULT_QURAN_READING_SETTINGS);
  const [tafsirVisible, setTafsirVisible] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirText, setTafsirText] = useState('');
  const [tafsirError, setTafsirError] = useState('');


  const openTafsir = async () => {
    if (!isPremium) {
      const message = 'Tafsir is a Premium feature.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Premium Feature', message);
      return;
    }

    setTafsirVisible(true);
    setTafsirLoading(true);
    setTafsirText('');
    setTafsirError('');

    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:${ayahNumber}`
      );

      if (!response.ok) {
        throw new Error(`Tafsir service returned HTTP ${response.status}.`);
      }

      const data = await response.json();
      const text = data?.tafsir?.text;

      if (typeof text !== 'string' || !text.trim()) {
        throw new Error('No Tafsir text was returned for this Ayah.');
      }

      setTafsirText(
        text
          .replace(/<br\s*\/?>(?=.)/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .trim()
      );
    } catch (error) {
      setTafsirError(
        error instanceof Error
          ? error.message
          : 'Unable to load Tafsir right now.'
      );
    } finally {
      setTafsirLoading(false);
    }
  };

  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3,'0')}${String(ayahNumber).padStart(3,'0')}.mp3`;
  const player = useAudioPlayer(null);
  const playAudio = () => {
    if (!isPremium) {
      const message='Quran Audio is a Premium feature.';
      if (Platform.OS === 'web') window.alert(message); else Alert.alert('Premium Feature',message);
      return;
    }
    if (onPlayAyah) {
      onPlayAyah();
      return;
    }
    player.replace(audioUrl);
    player.play();
  };
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.ayahNumber}>
          <Text style={styles.ayahNumberText}>
            {ayahNumber}
          </Text>
        </View>

        {isPremium && (
          <View style={styles.actions}>
            <View style={styles.premiumMiniBadge}>
              <Ionicons name="sparkles" size={10} color="#D8B36A" />
              <Text style={styles.premiumMiniBadgeText}>PREMIUM</Text>
            </View>

            <Pressable onPress={openTafsir} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Open Tafsir for Ayah ${ayahNumber}`}>
              <Ionicons name="book-outline" size={21} color="#D8B36A" />
            </Pressable>

            <Pressable onPress={playAudio} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Play Ayah ${ayahNumber}`}>
              <Ionicons name="play-circle-outline" size={21} color="#D8B36A" />
            </Pressable>

            <Pressable
              onPress={() => onBookmarkPress?.()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                bookmarked
                  ? `Remove bookmark from Ayah ${ayahNumber}`
                  : `Bookmark Ayah ${ayahNumber}`
              }
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={21}
                color={bookmarked ? '#D8B36A' : '#8D91A3'}
              />
            </Pressable>
          </View>
        )}
      </View>

      <QuranArabicText
        style={[
          styles.arabicText,
          {
            fontSize: fontSize ?? readingSettings.fontSize,
            lineHeight: lineSpacing ?? readingSettings.lineSpacing,
            marginBottom:
              readingSettings.mode === 'compact' ? 0 : 2,
          },
        ]}
      >
        {arabicText}
      </QuranArabicText>

      {translation ? (
        <View style={styles.translationBox}>
          <Text
            style={[
              styles.translationText,
              isUrdu && styles.urduTranslationText,
            ]}
          >
            {translation}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const rawStyles = {
  flex: { flex: 1 },

  premiumMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#806B3D',
  },

  premiumMiniBadgeText: {
    color: '#D8B36A',
    fontSize: 6,
    fontWeight: '900',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },

  tafsirModal: {
    maxHeight: '82%',
    backgroundColor: '#0D1016',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#252A35',
  },

  tafsirHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  tafsirTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  tafsirSubtitle: {
    color: '#8D92A0',
    fontSize: 11,
    marginTop: 3,
  },

  tafsirScroll: { maxHeight: 560 },

  tafsirText: {
    color: '#D7D9DF',
    fontSize: 14,
    lineHeight: 23,
  },

  tafsirSource: {
    color: '#777D89',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#252A35',
  },

  tafsirState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  tafsirStateText: {
    color: '#A4A9B5',
    fontSize: 12,
    marginTop: 10,
  },

  tafsirError: {
    color: '#A4A9B5',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },

  sourceButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#806B3D',
  },

  sourceButtonText: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#10131A',
    borderRadius: 20,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#202530',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  ayahNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#1B1F28',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ayahNumberText: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '800',
  },

  arabicText: {
    color: '#F2EBDD',
    fontSize: 25,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  translationBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#272C37',
  },

  translationText: {
    color: '#C5C8D1',
    fontSize: 15,
    lineHeight: 25,
  },

  urduTranslationText: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontSize: 17,
    lineHeight: 30,
  },
};