import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getAllUserProfiles,
  type FirestoreUserProfile,
} from '../firebase/firestore';

import {
  getPremiumSubscription,
  savePremiumSubscription,
} from '../premium/premiumService';

import {
  PREMIUM_PLANS,
  type PremiumSubscription,
} from '../premium/premiumTypes';

type AdminPremiumScreenProps = {
  onBack: () => void;
};

export default function AdminPremiumScreen({
  onBack,
}: AdminPremiumScreenProps) {
  const [users, setUsers] =
    useState<FirestoreUserProfile[]>([]);

  const [selectedUser, setSelectedUser] =
    useState<FirestoreUserProfile | null>(null);

  const [currentSubscription, setCurrentSubscription] =
    useState<PremiumSubscription | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);

      const result =
        await getAllUserProfiles();

      setUsers(
        result.filter(
          (user) =>
            user.role !== 'admin'
        )
      );
    } catch (loadError) {
      console.error(
        'Premium users loading error:',
        loadError
      );

      setError(
        'Unable to load users.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function selectUser(
    user: FirestoreUserProfile
  ) {
    try {
      setSelectedUser(user);

      const subscription =
        await getPremiumSubscription(
          user.uid
        );

      setCurrentSubscription(
        subscription
      );
    } catch (loadError) {
      console.error(
        'Premium subscription loading error:',
        loadError
      );

      setCurrentSubscription(
        null
      );
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function getExpiryDate(
    durationDays: number | null
  ): string | null {
    if (durationDays === null) {
      return null;
    }

    const expiry =
      new Date();

    expiry.setDate(
      expiry.getDate() +
        durationDays
    );

    return expiry.toISOString();
  }

  async function activatePremium(
    planId: string
  ) {
    if (!selectedUser) {
      return;
    }

    const plan =
      PREMIUM_PLANS.find(
        (item) =>
          item.id === planId
      );

    if (!plan) {
      return;
    }

    try {
      setSaving(true);

      const now =
        new Date().toISOString();

      const subscription: PremiumSubscription =
        {
          userId:
            selectedUser.uid,

          planId:
            plan.id,

          status: 'ACTIVE',

          startedAt: now,

          expiresAt:
            getExpiryDate(
              plan.durationDays
            ),

          source: 'ADMIN',

          paymentId: null,

          autoRenew: false,
        };

      await savePremiumSubscription(
        subscription
      );

      setCurrentSubscription(
        subscription
      );

      if (Platform.OS === 'web') {
        window.alert(
          `${plan.name} Premium activated for ${selectedUser.email}`
        );
      } else {
        Alert.alert(
          'Premium Activated',
          `${plan.name} Premium activated successfully.`
        );
      }
    } catch (saveError) {
      console.error(
        'Premium activation error:',
        saveError
      );

      if (Platform.OS === 'web') {
        window.alert(
          'Unable to activate Premium.'
        );
      } else {
        Alert.alert(
          'Error',
          'Unable to activate Premium.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function removePremium() {
    if (!selectedUser) {
      return;
    }

    try {
      setSaving(true);

      const cancelled: PremiumSubscription =
        {
          userId:
            selectedUser.uid,

          planId:
            currentSubscription?.planId ??
            'admin',

          status: 'CANCELLED',

          startedAt:
            currentSubscription?.startedAt ??
            new Date().toISOString(),

          expiresAt:
            currentSubscription?.expiresAt ??
            null,

          source:
            currentSubscription?.source ??
            'ADMIN',

          paymentId: null,

          autoRenew: false,
        };

      await savePremiumSubscription(
        cancelled
      );

      setCurrentSubscription(
        cancelled
      );

      if (Platform.OS === 'web') {
        window.alert(
          'Premium access cancelled.'
        );
      } else {
        Alert.alert(
          'Premium Cancelled',
          'Premium access has been cancelled.'
        );
      }
    } catch (saveError) {
      console.error(
        'Premium cancellation error:',
        saveError
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(
    value: string | null
  ): string {
    if (!value) {
      return 'Lifetime';
    }

    const date =
      new Date(value);

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      return 'Unknown';
    }

    return date.toLocaleString();
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View
        style={styles.container}
      >
        <View
          style={styles.header}
        >
          <Pressable
            onPress={onBack}
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={styles.headerBody}
          >
            <Text
              style={styles.eyebrow}
            >
              ADMIN CONTROL CENTER
            </Text>

            <Text
              style={styles.title}
            >
              Premium Management
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            Select User
          </Text>

          {loading ? (
            <View
              style={styles.loading}
            >
              <ActivityIndicator
                color="#D8B36A"
              />

              <Text
                style={styles.loadingText}
              >
                Loading users…
              </Text>
            </View>
          ) : error ? (
            <View
              style={styles.errorCard}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>

              <Pressable
                onPress={
                  loadUsers
                }
                style={
                  styles.retryButton
                }
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            users.map(
              (user) => (
                <Pressable
                  key={user.uid}
                  onPress={() =>
                    selectUser(
                      user
                    )
                  }
                  style={[
                    styles.userCard,
                    selectedUser?.uid ===
                      user.uid &&
                      styles.selectedUser,
                  ]}
                >
                  <View
                    style={
                      styles.avatar
                    }
                  >
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {(user.displayName ||
                        user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.userInfo
                    }
                  >
                    <Text
                      style={
                        styles.userName
                      }
                    >
                      {user.displayName ||
                        'Unnamed user'}
                    </Text>

                    <Text
                      style={
                        styles.userEmail
                      }
                    >
                      {user.email}
                    </Text>
                  </View>

                  {selectedUser?.uid ===
                    user.uid && (
                    <Text
                      style={
                        styles.check
                      }
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              )
            )
          )}

          {selectedUser && (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Premium Access
              </Text>

              <View
                style={
                  styles.currentCard
                }
              >
                <Text
                  style={
                    styles.currentLabel
                  }
                >
                  CURRENT STATUS
                </Text>

                <Text
                  style={
                    styles.currentStatus
                  }
                >
                  {currentSubscription?.status ===
                  'ACTIVE'
                    ? 'ACTIVE'
                    : 'FREE'}
                </Text>

                {currentSubscription && (
                  <Text
                    style={
                      styles.currentExpiry
                    }
                  >
                    Expires:{' '}
                    {formatDate(
                      currentSubscription.expiresAt
                    )}
                  </Text>
                )}
              </View>

              <Text
                style={
                  styles.planTitle
                }
              >
                Activate Premium
              </Text>

              {PREMIUM_PLANS.map(
                (plan) => (
                  <Pressable
                    key={plan.id}
                    disabled={saving}
                    onPress={() =>
                      activatePremium(
                        plan.id
                      )
                    }
                    style={({ pressed }) => [
                      styles.planCard,
                      pressed &&
                        styles.pressed,
                      saving &&
                        styles.disabled,
                    ]}
                  >
                    <View>
                      <Text
                        style={
                          styles.planName
                        }
                      >
                        {plan.name}
                      </Text>

                      <Text
                        style={
                          styles.planDescription
                        }
                      >
                        {plan.durationDays ===
                        null
                          ? 'Unlimited Premium access'
                          : `Premium access for ${plan.durationDays} days`}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.planArrow
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                )
              )}

              {currentSubscription?.status ===
                'ACTIVE' && (
                <Pressable
                  disabled={saving}
                  onPress={
                    removePremium
                  }
                  style={
                    styles.cancelButton
                  }
                >
                  {saving ? (
                    <ActivityIndicator
                      color="#F0A4AA"
                      size="small"
                    />
                  ) : (
                    <Text
                      style={
                        styles.cancelText
                      }
                    >
                      Cancel Premium Access
                    </Text>
                  )}
                </Pressable>
              )}
            </>
          )}

          {!selectedUser &&
            !loading && (
              <View
                style={
                  styles.emptyCard
                }
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  ⭐
                </Text>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Select a user
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Choose a user above to manage their Premium access.
                </Text>
              </View>
            )}

          <Pressable
            onPress={onBack}
            style={
              styles.bottomBack
            }
          >
            <Text
              style={
                styles.bottomBackText
              }
            >
              ← Back to Admin Dashboard
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#080A0F',
    },

    container: {
      flex: 1,
      backgroundColor: '#080A0F',
    },

    header: {
      minHeight: 78,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#171B24',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#12161E',
      borderWidth: 1,
      borderColor: '#252A34',
      alignItems: 'center',
      justifyContent: 'center',
    },

    backText: {
      color: '#F5F5F5',
      fontSize: 30,
      lineHeight: 30,
      marginTop: -3,
    },

    headerBody: {
      flex: 1,
      marginLeft: 14,
    },

    eyebrow: {
      color: '#D8B36A',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
    },

    title: {
      color: '#F7F7F7',
      fontSize: 22,
      fontWeight: '800',
      marginTop: 3,
    },

    content: {
      padding: 18,
      paddingBottom: 40,
    },

    sectionTitle: {
      color: '#E9E9EA',
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 12,
      marginTop: 4,
    },

    userCard: {
      minHeight: 70,
      padding: 11,
      borderRadius: 17,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
    },

    selectedUser: {
      borderColor: '#8D7543',
      backgroundColor: '#17150F',
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: 15,
      backgroundColor: '#1A1E27',
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: '#D8B36A',
      fontSize: 14,
      fontWeight: '800',
    },

    userInfo: {
      flex: 1,
      marginLeft: 12,
    },

    userName: {
      color: '#EEEEEF',
      fontSize: 13,
      fontWeight: '800',
    },

    userEmail: {
      color: '#747B87',
      fontSize: 10,
      marginTop: 4,
    },

    check: {
      color: '#D8B36A',
      fontSize: 20,
      fontWeight: '800',
      paddingHorizontal: 7,
    },

    loading: {
      minHeight: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: '#707783',
      fontSize: 11,
      marginTop: 8,
    },

    errorCard: {
      padding: 16,
      borderRadius: 17,
      backgroundColor: '#1A1113',
      borderWidth: 1,
      borderColor: '#5A292D',
    },

    errorText: {
      color: '#E6A2A8',
      fontSize: 11,
    },

    retryButton: {
      alignSelf: 'flex-start',
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: '#2A171A',
    },

    retryText: {
      color: '#F0B0B5',
      fontSize: 11,
      fontWeight: '800',
    },

    currentCard: {
      padding: 17,
      borderRadius: 19,
      backgroundColor: '#101812',
      borderWidth: 1,
      borderColor: '#294B38',
      marginBottom: 18,
    },

    currentLabel: {
      color: '#718276',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
    },

    currentStatus: {
      color: '#6ED6A0',
      fontSize: 24,
      fontWeight: '900',
      marginTop: 5,
    },

    currentExpiry: {
      color: '#87958B',
      fontSize: 10,
      marginTop: 6,
    },

    planTitle: {
      color: '#D7D8DA',
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 10,
    },

    planCard: {
      minHeight: 68,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 17,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 9,
    },

    planName: {
      color: '#EEEEEF',
      fontSize: 14,
      fontWeight: '800',
    },

    planDescription: {
      color: '#6F7681',
      fontSize: 10,
      marginTop: 4,
    },

    planArrow: {
      color: '#D8B36A',
      fontSize: 24,
    },

    pressed: {
      opacity: 0.65,
      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    disabled: {
      opacity: 0.5,
    },

    cancelButton: {
      minHeight: 48,
      borderRadius: 15,
      backgroundColor: '#1A1113',
      borderWidth: 1,
      borderColor: '#5A292D',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },

    cancelText: {
      color: '#E6A2A8',
      fontSize: 11,
      fontWeight: '800',
    },

    emptyCard: {
      padding: 28,
      borderRadius: 18,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      alignItems: 'center',
      marginTop: 10,
    },

    emptyIcon: {
      fontSize: 30,
    },

    emptyTitle: {
      color: '#EEEEEF',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 10,
    },

    emptyText: {
      color: '#686F7B',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 5,
      lineHeight: 17,
    },

    bottomBack: {
      minHeight: 48,
      borderRadius: 15,
      backgroundColor: '#12161E',
      borderWidth: 1,
      borderColor: '#272D38',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },

    bottomBackText: {
      color: '#AEB4BE',
      fontSize: 12,
      fontWeight: '700',
    },
  });
