import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { Alert, Platform } from 'react-native';
import { usePremium } from './premium/PremiumProvider';

import QuranArabicText from './QuranArabicText';

type QuranAyahCardProps = {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation?: string;
  isUrdu?: boolean;
  bookmarked?: boolean;
  onBookmarkPress?: () => void;
};

export default function QuranAyahCard({
  surahNumber,
  ayahNumber,
  arabicText,
  translation,
  isUrdu = false,
  bookmarked = false,
  onBookmarkPress,
}: QuranAyahCardProps) {
  const { isPremium } = usePremium();
  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3,'0')}${String(ayahNumber).padStart(3,'0')}.mp3`;
  const player = useAudioPlayer(audioUrl);
  const playAudio = () => {
    if (!isPremium) {
      const message='Quran Audio is a Premium feature.';
      if (Platform.OS === 'web') window.alert(message); else Alert.alert('Premium Feature',message);
      return;
    }
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

        <View style={styles.actions}>
        <Pressable onPress={playAudio} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Play Ayah ${ayahNumber}`}>
          <Ionicons name={isPremium ? 'play-circle-outline' : 'lock-closed-outline'} size={21} color={isPremium ? '#D8B36A' : '#777D89'} />
        </Pressable>
        <Pressable
          onPress={() => {
            if (!isPremium) {
              const message='Unlimited Quran Bookmarks are a Premium feature.';
              if (Platform.OS === 'web') window.alert(message); else Alert.alert('Premium Feature',message);
              return;
            }
            onBookmarkPress?.();
          }}
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
      </View>

      <QuranArabicText style={styles.arabicText}>
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

const styles = StyleSheet.create({
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
});
