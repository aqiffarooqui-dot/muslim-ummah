import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  usePremium,
} from './PremiumProvider';

export default function PremiumGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const {
    isPremium,
    loading,
  } = usePremium();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color="#D8B36A"
        />

        <Text style={styles.loadingText}>
          Checking premium access…
        </Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      fallback ?? (
        <View style={styles.locked}>
          <Text style={styles.icon}>
            ✦
          </Text>

          <Text style={styles.title}>
            Premium Feature
          </Text>

          <Text style={styles.text}>
            Upgrade to Muslim Ummah Premium
            to unlock this feature.
          </Text>
        </View>
      )
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0F',
  },

  loadingText: {
    color: '#777D89',
    fontSize: 12,
    marginTop: 12,
  },

  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0F',
    paddingHorizontal: 30,
  },

  icon: {
    color: '#D8B36A',
    fontSize: 42,
    marginBottom: 15,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  text: {
    color: '#858995',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
});
