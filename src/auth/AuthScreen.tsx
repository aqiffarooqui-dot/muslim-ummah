import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import { useAuth } from './AuthProvider';
import { useTheme } from '../themes/ThemeProvider';
import { createThemedStyles } from '../themes/themeStyleMapper';

export default function AuthScreen() {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme, rawStyles);
  const {
    signIn,
    signUp,
    signInWithGoogle,
    sendResetEmail,
  } = useAuth();

  const [mode, setMode] =
    useState<'login' | 'signup'>(
      'login'
    );

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function handleSubmit() {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(
        'Please enter your email.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (
      mode === 'signup' &&
      !name.trim()
    ) {
      setError(
        'Please enter your name.'
      );
      return;
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        await signIn(
          email,
          password
        );
      } else {
        await signUp(
          email,
          password,
          name
        );
      }
    } catch (err: any) {
      let message =
        'Something went wrong. Please try again.';

      if (
        err?.code ===
        'auth/invalid-credential'
      ) {
        message =
          'Email or password is incorrect.';
      } else if (
        err?.code ===
        'auth/email-already-in-use'
      ) {
        message =
          'An account already exists with this email.';
      } else if (
        err?.code ===
        'auth/invalid-email'
      ) {
        message =
          'Please enter a valid email address.';
      } else if (
        err?.code ===
        'auth/weak-password'
      ) {
        message =
          'Password must be at least 6 characters.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setSuccess('');

    try {
      setLoading(true);

      await signInWithGoogle();
    } catch (err: any) {
      let message =
        'Google Sign-In failed. Please try again.';

      if (
        err?.code ===
        'auth/popup-closed-by-user'
      ) {
        message =
          'Google Sign-In was cancelled.';
      } else if (
        err?.code ===
        'auth/popup-blocked'
      ) {
        message =
          'Google Sign-In popup was blocked. Please allow popups and try again.';
      } else if (
        err?.code ===
        'auth/account-exists-with-different-credential'
      ) {
        message =
          'An account already exists with this email using another sign-in method.';
      } else if (
        err?.code ===
        'auth/unauthorized-domain'
      ) {
        message =
          'This website is not authorized for Google Sign-In yet. Please add the current domain in Firebase Authentication settings.';
      } else if (
        err?.code ===
        'auth/operation-not-allowed'
      ) {
        message =
          'Google Sign-In is not enabled in Firebase Authentication.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(
        'Enter your email address first, then tap Forgot password.'
      );
      return;
    }

    try {
      setResetLoading(true);

      await sendResetEmail(email);

      setSuccess(
        'Password reset email sent. Please check your inbox.'
      );
    } catch (err: any) {
      let message =
        'Unable to send the reset email. Please try again.';

      if (
        err?.code ===
        'auth/invalid-email'
      ) {
        message =
          'Please enter a valid email address.';
      } else if (
        err?.code ===
        'auth/user-not-found'
      ) {
        message =
          'No account was found with this email.';
      } else if (
        err?.code ===
        'auth/too-many-requests'
      ) {
        message =
          'Too many attempts. Please wait a while and try again.';
      }

      setError(message);
    } finally {
      setResetLoading(false);
    }
  }

  function switchMode() {
    setMode(
      mode === 'login'
        ? 'signup'
        : 'login'
    );

    setError('');
    setSuccess('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Ionicons
              name="moon"
              size={30}
              color="#D8B36A"
            />
          </View>

          <Text style={styles.title}>
            Muslim Ummah
          </Text>

          <Text style={styles.subtitle}>
            Your peaceful Islamic companion
          </Text>

          <View style={styles.card}>
            <Text style={styles.heading}>
              {mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </Text>

            <Text style={styles.description}>
              {mode === 'login'
                ? 'Continue your journey with Muslim Ummah.'
                : 'Create a free account to save your progress and preferences.'}
            </Text>

            {mode === 'signup' && (
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color="#858995"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#696D78"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={19}
                color="#858995"
              />

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#696D78"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#858995"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#696D78"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {mode === 'login' && (
              <Pressable
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#D8B36A"
                  />
                ) : (
                  <Text
                    style={
                      styles.forgotText
                    }
                  >
                    Forgot password?
                  </Text>
                )}
              </Pressable>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#FF8D8D"
                />

                <Text style={styles.error}>
                  {error}
                </Text>
              </View>
            )}

            {!!success && (
              <View style={styles.successBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#8FD6A8"
                />

                <Text
                  style={styles.success}
                >
                  {success}
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#0A0B0F"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </Text>
              )}
            </Pressable>

            <View
              style={styles.dividerRow}
            >
              <View
                style={styles.divider}
              />

              <Text
                style={styles.dividerText}
              >
                OR
              </Text>

              <View
                style={styles.divider}
              />
            </View>

            <Pressable
              style={[
                styles.googleButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Text
                    style={
                      styles.googleG
                    }
                  >
                    G
                  </Text>

                  <Text
                    style={
                      styles.googleText
                    }
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={switchMode}
              disabled={loading}
            >
              <Text
                style={styles.switchText}
              >
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}

                <Text
                  style={
                    styles.switchHighlight
                  }
                >
                  {mode === 'login'
                    ? 'Create one'
                    : 'Sign in'}
                </Text>
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Your account helps keep your Quran
            progress, bookmarks and preferences
            synchronized.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const rawStyles = {
  safe: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#151922',
    borderWidth: 1,
    borderColor: '#2A2E39',
    marginBottom: 18,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.7,
  },

  subtitle: {
    color: '#9297A3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },

  card: {
    backgroundColor: '#11141B',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#242934',
    padding: 22,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  description: {
    color: '#858995',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },

  inputWrapper: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292E39',
    backgroundColor: '#0B0D12',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 11,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    minHeight: 30,
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  forgotText: {
    color: '#D8B36A',
    fontSize: 13,
    fontWeight: '700',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#291719',
    borderWidth: 1,
    borderColor: '#4B2528',
    borderRadius: 14,
    padding: 12,
    marginBottom: 13,
  },

  error: {
    color: '#FFB1B1',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14231A',
    borderWidth: 1,
    borderColor: '#274735',
    borderRadius: 14,
    padding: 12,
    marginBottom: 13,
  },

  success: {
    color: '#A9E4BC',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },

  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#D8B36A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: '#0A0B0F',
    fontSize: 15,
    fontWeight: '800',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#292E39',
  },

  dividerText: {
    color: '#666B76',
    fontSize: 11,
    marginHorizontal: 12,
    fontWeight: '700',
  },

  googleButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#181B22',
    borderWidth: 1,
    borderColor: '#303541',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  googleG: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    marginRight: 10,
  },

  googleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  switchText: {
    color: '#8C919D',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 22,
  },

  switchHighlight: {
    color: '#D8B36A',
    fontWeight: '800',
  },

  footer: {
    color: '#5F646F',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 22,
    paddingHorizontal: 15,
  },
};
