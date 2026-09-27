import React from 'react';

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../auth/AuthProvider';
import { usePremium } from '../premium/PremiumProvider';

type Props = {
  onBack: () => void;
  onPremium: () => void;
  onAdmin: () => void;
};

export default function ProfileScreen({
  onBack,
  onPremium,
  onAdmin,
}: Props) {
  const {
    user,
    profile,
    isAdmin,
    logout,
  } = useAuth();

  const {
    subscription,
    isPremium,
    loading: premiumLoading,
  } = usePremium();

  const displayName =
    profile?.displayName ||
    user?.displayName ||
    'Muslim Ummah User';

  const email =
    profile?.email ||
    user?.email ||
    '';

  async function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error(
                'Logout error:',
                error
              );

              Alert.alert(
                'Logout Failed',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
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

          <Text style={styles.headerTitle}>
            Profile
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName
                .trim()
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>
            {displayName}
          </Text>

          <Text style={styles.email}>
            {email}
          </Text>

          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color="#D9C77A"
              />

              <Text style={styles.adminBadgeText}>
                Administrator
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Membership
        </Text>

        <Pressable
          style={styles.membershipCard}
          onPress={onPremium}
        >
          <View style={styles.membershipIcon}>
            <Ionicons
              name="diamond"
              size={23}
              color="#D9C77A"
            />
          </View>

          <View style={styles.membershipInfo}>
            <Text style={styles.membershipTitle}>
              {premiumLoading
                ? 'Checking Premium...'
                : isPremium
                ? 'Premium Active'
                : 'Muslim Ummah Premium'}
            </Text>

            <Text style={styles.membershipText}>
              {premiumLoading
                ? 'Please wait'
                : isPremium
                ? subscription?.planId
                  ? `Plan: ${subscription.planId}`
                  : 'Your premium access is active'
                : 'Unlock themes, audio and advanced features'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#59645E"
          />
        </Pressable>

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="mail-outline"
            title="Email"
            value={email}
          />

          <InfoRow
            icon="person-outline"
            title="Account"
            value={isAdmin ? 'Admin account' : 'Standard account'}
          />

          <InfoRow
            icon="shield-checkmark-outline"
            title="Security"
            value="Firebase Authentication"
            last
          />
        </View>

        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>
              Administration
            </Text>

            <Pressable
              style={styles.adminCard}
              onPress={onAdmin}
            >
              <View style={styles.adminIcon}>
                <Ionicons
                  name="grid-outline"
                  size={23}
                  color="#D9C77A"
                />
              </View>

              <View style={styles.adminInfo}>
                <Text style={styles.adminTitle}>
                  Admin Control Center
                </Text>

                <Text style={styles.adminText}>
                  Manage users, premium, payments,
                  announcements and analytics
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#59645E"
              />
            </Pressable>
          </>
        )}

        <Text style={styles.sectionTitle}>
          Account Actions
        </Text>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#E58D8D"
          />

          <Text style={styles.logoutText}>
            Log Out
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Muslim Ummah • Your modern Islamic companion
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  title,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#D9C77A"
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>
          {title}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07100D',
  },

  content: {
    paddingTop: 22,
    paddingHorizontal: 18,
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
    backgroundColor: '#111B17',
    borderWidth: 1,
    borderColor: '#29372F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  headerTitle: {
    color: '#F0F0E7',
    fontSize: 18,
    fontWeight: '800',
  },

  profileHero: {
    alignItems: 'center',
    backgroundColor: '#13251E',
    borderWidth: 1,
    borderColor: '#294239',
    borderRadius: 27,
    padding: 25,
    marginTop: 18,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 27,
    backgroundColor: '#1D3027',
    borderWidth: 1,
    borderColor: '#3A5145',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#D9C77A',
    fontSize: 31,
    fontWeight: '800',
  },

  name: {
    color: '#F0F0E7',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 15,
  },

  email: {
    color: '#7F8A83',
    fontSize: 11,
    marginTop: 5,
  },

  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#211F18',
    borderWidth: 1,
    borderColor: '#44391F',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 13,
  },

  adminBadgeText: {
    color: '#D9C77A',
    fontSize: 10,
    fontWeight: '800',
  },

  sectionTitle: {
    color: '#EDEDE5',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 27,
    marginBottom: 11,
  },

  membershipCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#294034',
    borderRadius: 20,
    padding: 13,
  },

  membershipIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  membershipInfo: {
    flex: 1,
    marginLeft: 12,
  },

  membershipTitle: {
    color: '#E8E9E2',
    fontSize: 13,
    fontWeight: '800',
  },

  membershipText: {
    color: '#737E77',
    fontSize: 9,
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: '#101A16',
    borderWidth: 1,
    borderColor: '#24322C',
    borderRadius: 20,
    paddingHorizontal: 14,
  },

  infoRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#202D27',
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#1A2C24',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    color: '#6F7B74',
    fontSize: 9,
    fontWeight: '700',
  },

  infoValue: {
    color: '#DDE1DB',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  adminCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151912',
    borderWidth: 1,
    borderColor: '#44391F',
    borderRadius: 20,
    padding: 13,
  },

  adminIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },

  adminTitle: {
    color: '#E8E9E2',
    fontSize: 13,
    fontWeight: '800',
  },

  adminText: {
    color: '#7A8179',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  logoutButton: {
    height: 55,
    borderRadius: 18,
    backgroundColor: '#1A1112',
    borderWidth: 1,
    borderColor: '#40282A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  logoutText: {
    color: '#E58D8D',
    fontSize: 13,
    fontWeight: '800',
  },

  footer: {
    color: '#59645E',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 28,
  },
});
