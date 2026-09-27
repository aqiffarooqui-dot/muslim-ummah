import React from 'react';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  PREMIUM_PLANS,
} from './premiumTypes';

import {
  usePremium,
} from './PremiumProvider';

export default function PremiumScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  const {
    subscription,
    isPremium,
  } = usePremium();

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              style={styles.backButton}
              onPress={onBack}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color="#FFFFFF"
              />
            </Pressable>
          ) : (
            <View
              style={styles.headerSpacer}
            />
          )}

          <Text style={styles.headerTitle}>
            Premium
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <View style={styles.hero}>
          <View style={styles.crown}>
            <Ionicons
              name="diamond"
              size={28}
              color="#D8B36A"
            />
          </View>

          <Text style={styles.heroTitle}>
            Muslim Ummah Premium
          </Text>

          <Text style={styles.heroText}>
            A deeper, more personal Islamic
            experience.
          </Text>

          {isPremium && (
            <View style={styles.activeBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#9EE5B6"
              />

              <Text
                style={styles.activeText}
              >
                Premium Active
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Premium Features
        </Text>

        <Feature
          icon="color-palette-outline"
          title="Exclusive Themes"
          text="Midnight, AMOLED, Emerald, Royal and more."
        />

        <Feature
          icon="book-outline"
          title="Advanced Quran"
          text="Reading styles, fonts, spacing and collections."
        />

        <Feature
          icon="headset-outline"
          title="Enhanced Audio"
          text="Playback controls, repeat and personalized listening."
        />

        <Feature
          icon="stats-chart-outline"
          title="Reading Insights"
          text="Progress, streaks and personal Quran statistics."
        />

        <Feature
          icon="notifications-outline"
          title="Advanced Reminders"
          text="Personalized prayer and Islamic reminders."
        />

        <Text style={styles.sectionTitle}>
          Choose a Plan
        </Text>

        {PREMIUM_PLANS.map(
          (plan) => (
            <Pressable
              key={plan.id}
              style={styles.plan}
              onPress={() => {
                console.log(
                  'Premium plan selected:',
                  plan.id
                );
              }}
            >
              <View style={styles.planIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color="#D8B36A"
                />
              </View>

              <View
                style={styles.planInfo}
              >
                <Text
                  style={styles.planName}
                >
                  {plan.name}
                </Text>

                <Text
                  style={styles.planDescription}
                >
                  Premium access
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#59616D"
              />
            </Pressable>
          )
        )}

        {subscription && (
          <View style={styles.currentPlan}>
            <Text
              style={styles.currentLabel}
            >
              CURRENT SUBSCRIPTION
            </Text>

            <Text
              style={styles.currentValue}
            >
              {subscription.planId}
            </Text>

            <Text
              style={styles.currentStatus}
            >
              Status: {subscription.status}
            </Text>

            {subscription.expiresAt && (
              <Text
                style={styles.currentStatus}
              >
                Expires:{' '}
                {new Date(
                  subscription.expiresAt
                ).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#D8B36A"
        />
      </View>

      <View
        style={styles.featureInfo}
      >
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#151922',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  hero: {
    borderRadius: 28,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#292E39',
    padding: 25,
    alignItems: 'center',
    marginTop: 18,
  },

  crown: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 17,
  },

  heroText: {
    color: '#8C919D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16231C',
    borderWidth: 1,
    borderColor: '#294434',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 15,
    gap: 6,
  },

  activeText: {
    color: '#9EE5B6',
    fontSize: 11,
    fontWeight: '700',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 28,
    marginBottom: 12,
  },

  feature: {
    flexDirection: 'row',
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 19,
    padding: 14,
    marginBottom: 9,
  },

  featureIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#1D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },

  featureTitle: {
    color: '#EDEEF0',
    fontSize: 13,
    fontWeight: '700',
  },

  featureText: {
    color: '#777D89',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  plan: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 19,
    padding: 12,
    marginBottom: 9,
  },

  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  planInfo: {
    flex: 1,
    marginLeft: 12,
  },

  planName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  planDescription: {
    color: '#747A85',
    fontSize: 10,
    marginTop: 3,
  },

  currentPlan: {
    marginTop: 18,
    borderRadius: 19,
    padding: 17,
    backgroundColor: '#121A16',
    borderWidth: 1,
    borderColor: '#294034',
  },

  currentLabel: {
    color: '#758179',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  currentValue: {
    color: '#D8B36A',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 7,
  },

  currentStatus: {
    color: '#929A94',
    fontSize: 11,
    marginTop: 4,
  },
});
