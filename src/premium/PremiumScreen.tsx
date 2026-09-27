import React from 'react';

import {
  ActivityIndicator,
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
import { useTheme } from '../themes/ThemeProvider';
import { createThemedStyles } from '../themes/themeStyleMapper';

export default function PremiumScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme);
  const {
    subscription,
    isPremium,
    loading,
    refreshPremium,
  } = usePremium();

  function getExpiryText() {
    if (!subscription?.expiresAt) {
      return 'Lifetime access';
    }

    const expiry =
      new Date(
        subscription.expiresAt
      ).getTime();

    const remaining =
      expiry - Date.now();

    if (remaining <= 0) {
      return 'Premium expired';
    }

    const days = Math.ceil(
      remaining /
        (1000 * 60 * 60 * 24)
    );

    if (days === 1) {
      return 'Expires tomorrow';
    }

    return `${days} days remaining`;
  }

  function getPlanName() {
    if (!subscription) {
      return 'No active plan';
    }

    const plan =
      PREMIUM_PLANS.find(
        (item) =>
          item.id ===
          subscription.planId
      );

    return (
      plan?.name ??
      subscription.planId
    );
  }

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

          <Pressable
            style={styles.refreshButton}
            onPress={refreshPremium}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#D8B36A"
              />
            ) : (
              <Ionicons
                name="refresh"
                size={19}
                color="#D8B36A"
              />
            )}
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.crown}>
            <Ionicons
              name="diamond"
              size={29}
              color="#D8B36A"
            />
          </View>

          <Text style={styles.heroTitle}>
            Muslim Ummah Premium
          </Text>

          <Text style={styles.heroText}>
            A deeper, more personal Islamic
            experience with advanced
            features.
          </Text>

          <View
            style={
              isPremium
                ? styles.activeBadge
                : styles.inactiveBadge
            }
          >
            <Ionicons
              name={
                isPremium
                  ? 'checkmark-circle'
                  : 'lock-closed'
              }
              size={16}
              color={
                isPremium
                  ? '#9EE5B6'
                  : '#A3A8B2'
              }
            />

            <Text
              style={
                isPremium
                  ? styles.activeText
                  : styles.inactiveText
              }
            >
              {isPremium
                ? 'Premium Active'
                : 'Premium Required'}
            </Text>
          </View>

          {isPremium && (
            <Text style={styles.remainingText}>
              {getExpiryText()}
            </Text>
          )}
        </View>

        {isPremium && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View>
                <Text
                  style={styles.statusLabel}
                >
                  YOUR PREMIUM
                </Text>

                <Text
                  style={styles.statusPlan}
                >
                  {getPlanName()}
                </Text>
              </View>

              <View style={styles.statusIcon}>
                <Ionicons
                  name="star"
                  size={18}
                  color="#D8B36A"
                />
              </View>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusRow}>
              <Text
                style={styles.statusKey}
              >
                Status
              </Text>

              <Text
                style={styles.statusValue}
              >
                {subscription?.status ??
                  'ACTIVE'}
              </Text>
            </View>

            {subscription?.startedAt && (
              <View style={styles.statusRow}>
                <Text
                  style={styles.statusKey}
                >
                  Started
                </Text>

                <Text
                  style={styles.statusValue}
                >
                  {new Date(
                    subscription.startedAt
                  ).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Text
                style={styles.statusKey}
              >
                Access
              </Text>

              <Text
                style={styles.statusValue}
              >
                {subscription?.expiresAt
                  ? new Date(
                      subscription.expiresAt
                    ).toLocaleDateString()
                  : 'Lifetime'}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Premium Features
        </Text>

        <View style={styles.featureGrid}>
          <PremiumFeature
            icon="color-palette-outline"
            title="Premium Themes"
            text="Exclusive dark, AMOLED, Emerald and Royal themes."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="book-outline"
            title="Advanced Quran"
            text="Enhanced reading controls, fonts, spacing and preferences."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="headset-outline"
            title="Quran Audio"
            text="Enhanced listening experience with playback controls."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="bookmark-outline"
            title="Unlimited Bookmarks"
            text="Keep your important Ayahs and reading points organized."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="heart-outline"
            title="Duas Collection"
            text="Expanded personal Dua collection and favorites."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="library-outline"
            title="Hadith Library"
            text="Expanded Hadith reading and saved collections."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="moon-outline"
            title="Prayer Features"
            text="More personalized prayer and Islamic reminder controls."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="stats-chart-outline"
            title="Reading Insights"
            text="Track Quran progress, reading activity and personal streaks."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="notifications-outline"
            title="Advanced Reminders"
            text="More flexible Islamic and prayer reminder settings."
            enabled={isPremium}
          />

          <PremiumFeature
            icon="cloud-outline"
            title="Cloud Sync"
            text="Keep supported personal progress and preferences synchronized."
            enabled={isPremium}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Premium Benefits
        </Text>

        <Benefit
          icon="infinite-outline"
          text="Unlimited access to supported Premium features"
        />

        <Benefit
          icon="shield-checkmark-outline"
          text="Personal preferences and reading experience"
        />

        <Benefit
          icon="sparkles-outline"
          text="Exclusive Muslim Ummah experience"
        />

        <Benefit
          icon="sync-outline"
          text="Premium status synchronized with your account"
        />

        {!isPremium && (
          <>
            <Text style={styles.sectionTitle}>
              Choose a Plan
            </Text>

            <View style={styles.notice}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#D8B36A"
              />

              <Text style={styles.noticeText}>
                Premium plans are currently
                activated through the Muslim
                Ummah account system. Select a
                plan below to see the available
                duration.
              </Text>
            </View>

            {PREMIUM_PLANS.map(
              (plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  duration={
                    plan.durationDays
                      ? `${plan.durationDays} days`
                      : 'Permanent access'
                  }
                />
              )
            )}
          </>
        )}

        {subscription && (
          <View style={styles.subscriptionCard}>
            <Text
              style={styles.subscriptionLabel}
            >
              SUBSCRIPTION INFORMATION
            </Text>

            <Text
              style={styles.subscriptionPlan}
            >
              {getPlanName()}
            </Text>

            <Text
              style={styles.subscriptionText}
            >
              Source: {subscription.source}
            </Text>

            <Text
              style={styles.subscriptionText}
            >
              Auto renew:{' '}
              {subscription.autoRenew
                ? 'Enabled'
                : 'Disabled'}
            </Text>

            {subscription.paymentId && (
              <Text
                style={styles.subscriptionText}
              >
                Payment ID:{' '}
                {subscription.paymentId}
              </Text>
            )}
          </View>
        )}

        <Pressable
          style={styles.refreshLarge}
          onPress={refreshPremium}
          disabled={loading}
        >
          <Ionicons
            name="sync-outline"
            size={18}
            color="#D8B36A"
          />

          <Text
            style={styles.refreshLargeText}
          >
            {loading
              ? 'Refreshing…'
              : 'Refresh Premium Status'}
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Premium access is linked to your
          Muslim Ummah account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PremiumFeature({
  icon,
  title,
  text,
  enabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  enabled: boolean;
}) {
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme);
  return (
    <View
      style={[
        styles.feature,
        enabled &&
          styles.featureEnabled,
      ]}
    >
      <View style={styles.featureTop}>
        <View style={styles.featureIcon}>
          <Ionicons
            name={icon}
            size={21}
            color="#D8B36A"
          />
        </View>

        <View
          style={
            enabled
              ? styles.unlocked
              : styles.locked
          }
        >
          <Ionicons
            name={
              enabled
                ? 'checkmark'
                : 'lock-closed'
            }
            size={11}
            color={
              enabled
                ? '#9EE5B6'
                : '#777D89'
            }
          />
        </View>
      </View>

      <Text
        style={styles.featureTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.featureText}
      >
        {text}
      </Text>
    </View>
  );
}

function Benefit({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme);
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Ionicons
          name={icon}
          size={18}
          color="#D8B36A"
        />
      </View>

      <Text style={styles.benefitText}>
        {text}
      </Text>

      <Ionicons
        name="checkmark"
        size={17}
        color="#9EE5B6"
      />
    </View>
  );
}

function PlanCard({
  name,
  duration,
}: {
  name: string;
  duration: string;
}) {
  const { theme } = useTheme();
  const styles = createLegacyStyles(theme);
  return (
    <View style={styles.plan}>
      <View style={styles.planIcon}>
        <Ionicons
          name="sparkles-outline"
          size={20}
          color="#D8B36A"
        />
      </View>

      <View style={styles.planInfo}>
        <Text style={styles.planName}>
          {name}
        </Text>

        <Text
          style={styles.planDescription}
        >
          {duration}
        </Text>
      </View>

      <View style={styles.planTag}>
        <Text style={styles.planTagText}>
          PREMIUM
        </Text>
      </View>
    </View>
  );
}

const createLegacyStyles = (theme: any) => createThemedStyles(theme, {
  safe: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  content: {
    padding: 18,
    paddingBottom: 55,
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

  refreshButton: {
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
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#403923',
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

  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191A1F',
    borderWidth: 1,
    borderColor: '#30343D',
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

  inactiveText: {
    color: '#A3A8B2',
    fontSize: 11,
    fontWeight: '700',
  },

  remainingText: {
    color: '#D8B36A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },

  statusCard: {
    marginTop: 14,
    borderRadius: 21,
    padding: 17,
    backgroundColor: '#121A16',
    borderWidth: 1,
    borderColor: '#294034',
  },

  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLabel: {
    color: '#758179',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  statusPlan: {
    color: '#D8B36A',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 6,
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDivider: {
    height: 1,
    backgroundColor: '#28362E',
    marginVertical: 14,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  statusKey: {
    color: '#778079',
    fontSize: 11,
  },

  statusValue: {
    color: '#DCE2DD',
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

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  feature: {
    width: '48.2%',
    minHeight: 166,
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 19,
    padding: 14,
    marginBottom: 10,
  },

  featureEnabled: {
    borderColor: '#3A3528',
  },

  featureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  featureIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#1D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  unlocked: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: '#16231C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locked: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: '#1B1D22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureTitle: {
    color: '#EDEEF0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 13,
  },

  featureText: {
    color: '#777D89',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  benefit: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 17,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  benefitText: {
    flex: 1,
    color: '#C9CDD4',
    fontSize: 11,
    lineHeight: 16,
    marginHorizontal: 11,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171610',
    borderWidth: 1,
    borderColor: '#393323',
    borderRadius: 17,
    padding: 13,
    marginBottom: 12,
  },

  noticeText: {
    flex: 1,
    color: '#9B9585',
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 9,
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

  planTag: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#211F18',
  },

  planTagText: {
    color: '#D8B36A',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  subscriptionCard: {
    marginTop: 18,
    borderRadius: 19,
    padding: 17,
    backgroundColor: '#12151C',
    borderWidth: 1,
    borderColor: '#292E39',
  },

  subscriptionLabel: {
    color: '#727986',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  subscriptionPlan: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 7,
  },

  subscriptionText: {
    color: '#858B96',
    fontSize: 10,
    marginTop: 6,
  },

  refreshLarge: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#302E27',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 8,
  },

  refreshLargeText: {
    color: '#D8B36A',
    fontSize: 12,
    fontWeight: '700',
  },

  footer: {
    color: '#555B66',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 18,
  },
});
