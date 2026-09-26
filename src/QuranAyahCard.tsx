import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import QuranArabicText from './QuranArabicText';

type QuranAyahCardProps = {
  ayahNumber: number;
  arabicText: string;
  translation?: string;
  isUrdu?: boolean;
  bookmarked?: boolean;
  onBookmarkPress?: () => void;
};

export default function QuranAyahCard({
  ayahNumber,
  arabicText,
  translation,
  isUrdu = false,
  bookmarked = false,
  onBookmarkPress,
}: QuranAyahCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.ayahNumber}>
          <Text style={styles.ayahNumberText}>
            {ayahNumber}
          </Text>
        </View>

        <Pressable
          onPress={onBookmarkPress}
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
