import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './src/themes/ThemeProvider';
import { createThemedStyles } from './src/themes/themeStyleMapper';

type AboutScreenProps = {
  onBack: () => void;
};

const features = [
  {
    icon: 'book-outline' as const,
    title: 'Quran',
    description: 'Read the Holy Quran with a clean and peaceful reading experience.',
  },
  {
    icon: 'library-outline' as const,
    title: 'Hadith',
    description: 'Explore authentic Hadith collections and daily Islamic wisdom.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Prayer Times',
    description: 'Keep track of your daily Salah and upcoming prayer.',
  },
  {
    icon: 'heart-outline' as const,
    title: 'Duas',
    description: 'Access useful supplications for everyday life.',
  },
  {
    icon: 'bookmark-outline' as const,
    title: 'Bookmarks',
    description: 'Save important Quran verses, Hadith and content for later.',
  },
  {
    icon: 'headset-outline' as const,
    title: 'Quran Audio',
    description: 'Listen to Quran recitation as the audio experience is added.',
  },
];

export default function AboutScreen({
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme); onBack }: AboutScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={21} color="#E9EAE3" />
            </Pressable>

            <View>
              <Text style={styles.eyebrow}>MUSLIM UMMAH</Text>
              <Text style={styles.title}>About</Text>
            </View>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="information-outline" size={20} color="#D9C77A" />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.logoCircle}>
            <Ionicons name="moon-outline" size={35} color="#D9C77A" />
          </View>

          <Text style={styles.appName}>Muslim Ummah</Text>

          <Text style={styles.tagline}>
            Your modern Islamic companion
          </Text>

          <Text style={styles.description}>
            Muslim Ummah is designed to bring useful Islamic resources
            together in one simple, peaceful and modern experience.
          </Text>

          <View style={styles.versionPill}>
            <Ionicons name="phone-portrait-outline" size={14} color="#AAB4AD" />
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What you can do</Text>
          <Text style={styles.sectionSubtitle}>
            Features planned for the Muslim Ummah experience
          </Text>
        </View>

        <View style={styles.featureList}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name={feature.icon}
                  size={21}
                  color="#D9C77A"
                />
              </View>

              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>

                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <Text style={styles.sectionSubtitle}>
            Built independently with care
          </Text>
        </View>

        <View style={styles.developerCard}>
          <View style={styles.developerAvatar}>
            <Text style={styles.developerInitials}>MA</Text>
          </View>

          <View style={styles.developerInfo}>
            <Text style={styles.developerName}>
              Mohd Aqif Farooqui
            </Text>

            <Text style={styles.developerRole}>
              Developer & Creator
            </Text>

            <Text style={styles.developerDescription}>
              Building Muslim Ummah as a free Islamic companion app with
              a focus on simplicity, useful features and a respectful user
              experience.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="sparkles-outline"
                size={19}
                color="#D9C77A"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Our goal</Text>

              <Text style={styles.infoText}>
                Make useful Islamic resources easy to access in one
                modern, distraction-free application.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color="#D9C77A"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Content responsibility</Text>

              <Text style={styles.infoText}>
                Quran and Islamic content will be connected from
                appropriately verified sources. AI will not be used to
                generate Quran verses.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerCard}>
          <Ionicons name="moon-outline" size={21} color="#D9C77A" />

          <Text style={styles.footerText}>
            Made with care for the Ummah
          </Text>

          <Text style={styles.footerSubtext}>
            Muslim Ummah • Free Islamic Companion
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const createLegacyStyles = (theme: any) => createThemedStyles(theme, {
  container: {
    flex: 1,
    backgroundColor: '#07100D',
  },

  content: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyebrow: {
    color: '#89938D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  title: {
    color: '#F0F0E7',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    borderRadius: 26,
    backgroundColor: '#13251E',
    borderWidth: 1,
    borderColor: '#294239',
    padding: 24,
    alignItems: 'center',
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 27,
    backgroundColor: '#1D3027',
    borderWidth: 1,
    borderColor: '#3A5045',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  appName: {
    color: '#F0F0E7',
    fontSize: 25,
    fontWeight: '700',
  },

  tagline: {
    color: '#D9C77A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  description: {
    color: '#98A49C',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 310,
  },

  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1B2C24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 13,
    marginTop: 17,
  },

  versionText: {
    color: '#AAB4AD',
    fontSize: 9,
    fontWeight: '700',
  },

  sectionHeader: {
    marginTop: 27,
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#EDEDE5',
    fontSize: 19,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#737D77',
    fontSize: 10,
    marginTop: 4,
  },

  featureList: {
    gap: 9,
  },

  featureCard: {
    minHeight: 82,
    borderRadius: 20,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  featureIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureInfo: {
    flex: 1,
    marginLeft: 13,
  },

  featureTitle: {
    color: '#E5E8E1',
    fontSize: 13,
    fontWeight: '700',
  },

  featureDescription: {
    color: '#737D77',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  developerCard: {
    borderRadius: 22,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  developerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#D9C77A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  developerInitials: {
    color: '#101512',
    fontSize: 18,
    fontWeight: '900',
  },

  developerInfo: {
    flex: 1,
    marginLeft: 14,
  },

  developerName: {
    color: '#E9EAE3',
    fontSize: 14,
    fontWeight: '700',
  },

  developerRole: {
    color: '#D9C77A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  developerDescription: {
    color: '#737D77',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },

  infoCard: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    padding: 15,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    color: '#E5E8E1',
    fontSize: 12,
    fontWeight: '700',
  },

  infoText: {
    color: '#737D77',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  footerCard: {
    marginTop: 13,
    borderRadius: 21,
    backgroundColor: '#0D1713',
    borderWidth: 1,
    borderColor: '#202E27',
    paddingVertical: 20,
    alignItems: 'center',
  },

  footerText: {
    color: '#D9DCD5',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 9,
  },

  footerSubtext: {
    color: '#68736C',
    fontSize: 9,
    marginTop: 4,
  },

  bottomSpace: {
    height: 90,
  },
});
