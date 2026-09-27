import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  usePremium,
} from './PremiumProvider';
import { useTheme } from '../themes/ThemeProvider';
import { createThemedStyles } from '../themes/themeStyleMapper';

import type {
  PremiumFeatureId,
} from './premiumFeatures';

type PremiumFeatureGateProps = {
  feature: PremiumFeatureId;
  children: React.ReactNode;
  onPremiumPress?: () => void;
  fallback?: React.ReactNode;
};

export default function PremiumFeatureGate({
  feature,
  children,
  onPremiumPress,
  fallback,
}: PremiumFeatureGateProps) {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme, rawStyles);
  const {
    isPremium,
  } = usePremium();

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Pressable
      style={styles.locked}
      onPress={onPremiumPress}
    >
      <View style={styles.icon}>
        <Ionicons
          name="lock-closed"
          size={19}
          color="#D8B36A"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>
          Premium Feature
        </Text>

        <Text style={styles.description}>
          Upgrade to Premium to unlock this
          feature.
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#646A75"
      />
    </Pressable>
  );
}

const rawStyles = {
  locked: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#292E39',
    borderRadius: 18,
    paddingHorizontal: 12,
  },

  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  info: {
    flex: 1,
    marginLeft: 11,
  },

  title: {
    color: '#EDEEF0',
    fontSize: 13,
    fontWeight: '800',
  },

  description: {
    color: '#777D89',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
};
