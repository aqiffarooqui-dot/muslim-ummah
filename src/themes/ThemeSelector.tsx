import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useTheme,
} from './ThemeProvider';

import { usePremium } from '../premium/PremiumProvider';

export default function ThemeSelector() {
  const {
    theme,
    themes,
    themeId,
    setTheme,
  } = useTheme();

  const {
    isPremium,
  } = usePremium();

  async function selectTheme(
    id: typeof themeId
  ) {
    await setTheme(id);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Ionicons
            name="color-palette-outline"
            size={19}
            color={theme.accent}
          />
        </View>

        <View style={styles.headingText}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
            ]}
          >
            Premium Themes
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: theme.textMuted },
            ]}
          >
            Personalize the entire Muslim Ummah
            experience.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {themes.map((item) => {
          const selected =
            item.id === themeId;

          const locked =
            item.id !== 'midnight' &&
            !isPremium;

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                selectTheme(item.id)
              }
              style={[
                styles.themeCard,
                {
                  backgroundColor:
                    item.background,
                  borderColor:
                    selected
                      ? item.accent
                      : item.border,
                },
              ]}
            >
              <View
                style={[
                  styles.preview,
                  {
                    backgroundColor:
                      item.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewHeader,
                    {
                      backgroundColor:
                        item.surfaceElevated,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewDot,
                      {
                        backgroundColor:
                          item.accent,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.previewLine,
                      {
                        backgroundColor:
                          item.textMuted,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor:
                        item.card,
                      borderColor:
                        item.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.previewSmall,
                      {
                        backgroundColor:
                          item.textSecondary,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.previewAccent,
                      {
                        backgroundColor:
                          item.accent,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.previewNav,
                    {
                      backgroundColor:
                        item.tabBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.navDot,
                      {
                        backgroundColor:
                          item.tabActive,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.navDot,
                      {
                        backgroundColor:
                          item.tabInactive,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.navDot,
                      {
                        backgroundColor:
                          item.tabInactive,
                      },
                    ]}
                  />
                </View>

                {locked && (
                  <View
                    style={styles.lockOverlay}
                  >
                    <View
                      style={[
                        styles.lockCircle,
                        {
                          backgroundColor:
                            item.surfaceElevated,
                          borderColor:
                            item.borderStrong,
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={item.accent}
                      />
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.cardBottom}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeName,
                    {
                      color: item.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.themeDescription,
                    {
                      color:
                        item.textMuted,
                    },
                  ]}
                >
                  {item.description}
                </Text>

                {selected && (
                  <View
                    style={[
                      styles.selected,
                      {
                        backgroundColor:
                          item.accentSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={item.accent}
                    />

                    <Text
                      style={[
                        styles.selectedText,
                        {
                          color:
                            item.accent,
                        },
                      ]}
                    >
                      Active
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  headingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headingText: {
    flex: 1,
    marginLeft: 11,
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  scroll: {
    paddingRight: 20,
    gap: 12,
  },

  themeCard: {
    width: 190,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  preview: {
    height: 125,
    padding: 10,
    position: 'relative',
  },

  previewHeader: {
    height: 22,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
  },

  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  previewLine: {
    width: 44,
    height: 4,
    borderRadius: 3,
    marginLeft: 7,
    opacity: 0.5,
  },

  previewCard: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 8,
    padding: 9,
    justifyContent: 'space-between',
  },

  previewSmall: {
    width: 62,
    height: 5,
    borderRadius: 3,
    opacity: 0.55,
  },

  previewAccent: {
    width: 30,
    height: 5,
    borderRadius: 3,
  },

  previewNav: {
    height: 18,
    borderRadius: 7,
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lockCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBottom: {
    padding: 12,
  },

  themeName: {
    fontSize: 13,
    fontWeight: '800',
  },

  themeDescription: {
    fontSize: 9,
    lineHeight: 13,
    marginTop: 4,
    minHeight: 26,
  },

  selected: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 8,
  },

  selectedText: {
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },
});
