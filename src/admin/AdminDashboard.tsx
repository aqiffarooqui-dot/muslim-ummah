import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

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
  getActiveUserCount,
  getAllUserProfiles,
  type FirestoreUserProfile,
  getUserCount,
} from '../firebase/firestore';

import {
  getPremiumSubscription,
} from '../premium/premiumService';

import {
  isPremiumActive,
} from '../premium/premiumAccess';

import AdminPremiumScreen from './AdminPremiumScreen';

type AdminDashboardProps = {
  onBack: () => void;
};

export default function AdminDashboard({
  onBack,
}: AdminDashboardProps) {
  const [users, setUsers] =
    useState<FirestoreUserProfile[]>([]);

  const [totalUsers, setTotalUsers] =
    useState(0);

  const [activeUsers, setActiveUsers] =
    useState(0);

  const [premiumUsers, setPremiumUsers] =
    useState(0);

  const [expiringSoon, setExpiringSoon] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showPremium, setShowPremium] =
    useState(false);

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          userCount,
          activeCount,
          allUsers,
        ] = await Promise.all([
          getUserCount(),
          getActiveUserCount(24),
          getAllUserProfiles(),
        ]);

        let activePremium = 0;
        let soonExpiring = 0;

        const now = Date.now();
        const sevenDays =
          now +
          7 * 24 * 60 * 60 * 1000;

        const nonAdminUsers =
          allUsers.filter(
            (user) =>
              user.role !== 'admin'
          );

        await Promise.all(
          nonAdminUsers.map(
            async (user) => {
              try {
                const subscription =
                  await getPremiumSubscription(
                    user.uid
                  );

                if (
                  isPremiumActive(
                    subscription
                  )
                ) {
                  activePremium += 1;

                  if (
                    subscription?.expiresAt
                  ) {
                    const expiry =
                      new Date(
                        subscription.expiresAt
                      ).getTime();

                    if (
                      expiry > now &&
                      expiry <= sevenDays
                    ) {
                      soonExpiring += 1;
                    }
                  }
                }
              } catch (premiumError) {
                console.error(
                  'Premium lookup failed:',
                  premiumError
                );
              }
            }
          )
        );

        setTotalUsers(userCount);
        setActiveUsers(activeCount);
        setPremiumUsers(activePremium);
        setExpiringSoon(
          soonExpiring
        );
        setUsers(allUsers);
      } catch (loadError) {
        console.error(
          'Admin dashboard loading error:',
          loadError
        );

        setError(
          'Unable to load Firebase user data.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function formatDate(
    value: string
  ): string {
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

  function getInitials(
    user: FirestoreUserProfile
  ): string {
    const name =
      user.displayName?.trim();

    if (name) {
      const parts =
        name.split(/\s+/);

      return parts
        .slice(0, 2)
        .map(
          (part) =>
            part
              .charAt(0)
              .toUpperCase()
        )
        .join('');
    }

    return (
      user.email
        .charAt(0)
        .toUpperCase() ||
      'U'
    );
  }

  if (showPremium) {
    return (
      <AdminPremiumScreen
        onBack={() => {
          setShowPremium(false);
          loadDashboard();
        }}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={styles.backIcon}
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={styles.headerText}
          >
            <Text
              style={styles.eyebrow}
            >
              ADMIN CONTROL CENTER
            </Text>

            <Text
              style={styles.title}
            >
              Dashboard
            </Text>
          </View>

          <Pressable
            onPress={loadDashboard}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.refreshIcon
              }
            >
              ↻
            </Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >
          <View
            style={styles.adminBadge}
          >
            <View
              style={
                styles.statusDot
              }
            />

            <Text
              style={
                styles.adminBadgeText
              }
            >
              Administrator access active
            </Text>
          </View>

          <View
            style={styles.statsGrid}
          >
            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statLabel}
              >
                TOTAL USERS
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#D8B36A"
                />
              ) : (
                <Text
                  style={styles.statValue}
                >
                  {totalUsers}
                </Text>
              )}

              <Text
                style={styles.statHint}
              >
                Registered profiles
              </Text>
            </View>

            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statLabel}
              >
                ACTIVE TODAY
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#6ED6A0"
                />
              ) : (
                <Text
                  style={styles.statValue}
                >
                  {activeUsers}
                </Text>
              )}

              <Text
                style={styles.statHint}
              >
                Active in last 24 hours
              </Text>
            </View>

            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statLabel}
              >
                PREMIUM
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#D8B36A"
                />
              ) : (
                <Text
                  style={styles.statValue}
                >
                  {premiumUsers}
                </Text>
              )}

              <Text
                style={styles.statHint}
              >
                Active Premium users
              </Text>
            </View>

            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statLabel}
              >
                EXPIRING SOON
              </Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#D8B36A"
                />
              ) : (
                <Text
                  style={styles.statValue}
                >
                  {expiringSoon}
                </Text>
              )}

              <Text
                style={styles.statHint}
              >
                Within next 7 days
              </Text>
            </View>
          </View>

          {error && (
            <View
              style={styles.errorCard}
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                Firebase data unavailable
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <Pressable
                onPress={
                  loadDashboard
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
          )}

          <Text
            style={styles.sectionTitle}
          >
            Management
          </Text>

          <Pressable
            onPress={() =>
              setShowPremium(true)
            }
            style={({ pressed }) => [
              styles.managementCard,
              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={styles.cardIcon}
            >
              <Text
                style={styles.cardIconText}
              >
                ⭐
              </Text>
            </View>

            <View
              style={styles.cardBody}
            >
              <Text
                style={styles.cardTitle}
              >
                Premium
              </Text>

              <Text
                style={styles.cardDescription}
              >
                Activate or cancel Premium access for users.
              </Text>
            </View>

            <Text
              style={styles.cardCount}
            >
              {premiumUsers}
            </Text>
          </Pressable>

          <View
            style={styles.managementCard}
          >
            <View
              style={styles.cardIcon}
            >
              <Text
                style={styles.cardIconText}
              >
                👥
              </Text>
            </View>

            <View
              style={styles.cardBody}
            >
              <Text
                style={styles.cardTitle}
              >
                Users
              </Text>

              <Text
                style={styles.cardDescription}
              >
                View registered users and account activity.
              </Text>
            </View>

            <Text
              style={styles.cardCount}
            >
              {totalUsers}
            </Text>
          </View>

          <View
            style={styles.managementCard}
          >
            <View
              style={styles.cardIcon}
            >
              <Text
                style={styles.cardIconText}
              >
                💳
              </Text>
            </View>

            <View
              style={styles.cardBody}
            >
              <Text
                style={styles.cardTitle}
              >
                Payments
              </Text>

              <Text
                style={styles.cardDescription}
              >
                Review payment records and activation status.
              </Text>
            </View>

            <Text
              style={styles.cardArrow}
            >
              ›
            </Text>
          </View>

          <View
            style={styles.managementCard}
          >
            <View
              style={styles.cardIcon}
            >
              <Text
                style={styles.cardIconText}
              >
                📢
              </Text>
            </View>

            <View
              style={styles.cardBody}
            >
              <Text
                style={styles.cardTitle}
              >
                Announcements
              </Text>

              <Text
                style={styles.cardDescription}
              >
                Create messages shown to app users.
              </Text>
            </View>

            <Text
              style={styles.cardArrow}
            >
              ›
            </Text>
          </View>

          <View
            style={styles.managementCard}
          >
            <View
              style={styles.cardIcon}
            >
              <Text
                style={styles.cardIconText}
              >
                📊
              </Text>
            </View>

            <View
              style={styles.cardBody}
            >
              <Text
                style={styles.cardTitle}
              >
                Analytics
              </Text>

              <Text
                style={styles.cardDescription}
              >
                Monitor usage and application activity.
              </Text>
            </View>

            <Text
              style={styles.cardArrow}
            >
              ›
            </Text>
          </View>

          <Text
            style={styles.sectionTitle}
          >
            Registered Users
          </Text>

          {loading ? (
            <View
              style={styles.loadingCard}
            >
              <ActivityIndicator
                size="small"
                color="#D8B36A"
              />

              <Text
                style={styles.loadingText}
              >
                Loading users…
              </Text>
            </View>
          ) : users.length === 0 ? (
            <View
              style={styles.emptyCard}
            >
              <Text
                style={styles.emptyIcon}
              >
                👤
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No users found
              </Text>

              <Text
                style={styles.emptyText}
              >
                Registered Firebase users will appear here.
              </Text>
            </View>
          ) : (
            users.map(
              (user) => (
                <View
                  key={user.uid}
                  style={styles.userCard}
                >
                  <View
                    style={styles.avatar}
                  >
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {getInitials(
                        user
                      )}
                    </Text>
                  </View>

                  <View
                    style={styles.userInfo}
                  >
                    <Text
                      numberOfLines={1}
                      style={
                        styles.userName
                      }
                    >
                      {user.displayName ||
                        'Unnamed user'}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={
                        styles.userEmail
                      }
                    >
                      {user.email ||
                        'No email'}
                    </Text>

                    <Text
                      style={
                        styles.userActive
                      }
                    >
                      Last active:{' '}
                      {formatDate(
                        user.lastActiveAt
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      user.role ===
                        'admin'
                        ? styles.adminRole
                        : styles.userRole,
                    ]}
                  >
                    <Text
                      style={
                        styles.roleText
                      }
                    >
                      {user.role ===
                      'admin'
                        ? 'ADMIN'
                        : 'USER'}
                    </Text>
                  </View>
                </View>
              )
            )
          )}

          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.bottomBack,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.bottomBackText
              }
            >
              ← Back to Profile
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

    backIcon: {
      color: '#F5F5F5',
      fontSize: 30,
      lineHeight: 30,
      marginTop: -3,
    },

    headerText: {
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
      fontSize: 25,
      fontWeight: '800',
      marginTop: 2,
    },

    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#12161E',
      borderWidth: 1,
      borderColor: '#252A34',
      alignItems: 'center',
      justifyContent: 'center',
    },

    refreshIcon: {
      color: '#D8B36A',
      fontSize: 25,
      fontWeight: '600',
    },

    pressed: {
      opacity: 0.65,
      transform: [
        {
          scale: 0.97,
        },
      ],
    },

    content: {
      padding: 18,
      paddingBottom: 40,
    },

    adminBadge: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 15,
      backgroundColor: '#101A16',
      borderWidth: 1,
      borderColor: '#244536',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#6ED6A0',
      marginRight: 9,
    },

    adminBadgeText: {
      color: '#9FE0BB',
      fontSize: 12,
      fontWeight: '700',
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },

    statCard: {
      width: '48.5%',
      minHeight: 126,
      padding: 15,
      borderRadius: 20,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      justifyContent: 'space-between',
    },

    statLabel: {
      color: '#747B88',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.1,
    },

    statValue: {
      color: '#F5F5F5',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 8,
    },

    statHint: {
      color: '#5F6672',
      fontSize: 10,
      lineHeight: 14,
      marginTop: 4,
    },

    errorCard: {
      marginTop: 14,
      padding: 16,
      borderRadius: 18,
      backgroundColor: '#1A1113',
      borderWidth: 1,
      borderColor: '#5A292D',
    },

    errorTitle: {
      color: '#F0A4AA',
      fontSize: 13,
      fontWeight: '800',
    },

    errorText: {
      color: '#B98287',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
    },

    retryButton: {
      alignSelf: 'flex-start',
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 11,
      backgroundColor: '#2A171A',
      borderWidth: 1,
      borderColor: '#6B3035',
    },

    retryText: {
      color: '#F0B0B5',
      fontSize: 11,
      fontWeight: '800',
    },

    sectionTitle: {
      color: '#E9E9EA',
      fontSize: 17,
      fontWeight: '800',
      marginTop: 26,
      marginBottom: 12,
    },

    managementCard: {
      minHeight: 82,
      padding: 14,
      borderRadius: 19,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#171B23',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardIconText: {
      fontSize: 21,
    },

    cardBody: {
      flex: 1,
      marginLeft: 13,
      marginRight: 8,
    },

    cardTitle: {
      color: '#F1F1F2',
      fontSize: 14,
      fontWeight: '800',
    },

    cardDescription: {
      color: '#6D7480',
      fontSize: 10.5,
      lineHeight: 15,
      marginTop: 4,
    },

    cardArrow: {
      color: '#555C68',
      fontSize: 25,
    },

    cardCount: {
      color: '#D8B36A',
      fontSize: 17,
      fontWeight: '800',
    },

    loadingCard: {
      minHeight: 100,
      borderRadius: 18,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: '#737A86',
      fontSize: 11,
      marginTop: 9,
    },

    emptyCard: {
      padding: 28,
      borderRadius: 18,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      alignItems: 'center',
    },

    emptyIcon: {
      fontSize: 28,
    },

    emptyTitle: {
      color: '#E9E9EA',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 10,
    },

    emptyText: {
      color: '#686F7B',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 5,
    },

    userCard: {
      minHeight: 82,
      padding: 12,
      borderRadius: 18,
      backgroundColor: '#10131A',
      borderWidth: 1,
      borderColor: '#20252F',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
    },

    avatar: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: '#1A1E27',
      borderWidth: 1,
      borderColor: '#2C323D',
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
      marginRight: 8,
    },

    userName: {
      color: '#EEEEEF',
      fontSize: 13,
      fontWeight: '800',
    },

    userEmail: {
      color: '#777E89',
      fontSize: 10.5,
      marginTop: 3,
    },

    userActive: {
      color: '#555D69',
      fontSize: 9.5,
      marginTop: 5,
    },

    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 9,
      borderWidth: 1,
    },

    adminRole: {
      backgroundColor: '#211D13',
      borderColor: '#5A4B29',
    },

    userRole: {
      backgroundColor: '#141820',
      borderColor: '#2B323D',
    },

    roleText: {
      color: '#B9B0A0',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.8,
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
