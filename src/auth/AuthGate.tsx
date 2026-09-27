import React from 'react';

import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AuthScreen from './AuthScreen';
import { useTheme } from '../themes/ThemeProvider';
import { createThemedStyles } from '../themes/themeStyleMapper';
import {
  AuthProvider,
  useAuth,
} from './AuthProvider';

function AuthGateContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme, rawStyles);
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <View style={styles.loading}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>
              ☾
            </Text>
          </View>

          <ActivityIndicator
            size="small"
            color="#D8B36A"
          />

          <Text style={styles.loadingText}>
            Preparing Muslim Ummah…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGateContent>
        {children}
      </AuthGateContent>
    </AuthProvider>
  );
}

const rawStyles = {
  safe: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#292E39',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  logoText: {
    color: '#D8B36A',
    fontSize: 34,
  },

  loadingText: {
    color: '#777D89',
    fontSize: 12,
    marginTop: 12,
  },
};
