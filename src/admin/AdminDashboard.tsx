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
  useAuth,
} from '../auth/AuthProvider';

type Props = {
  onBack: () => void;
};

export default function AdminDashboard({
  onBack,
}: Props) {
  const {
    profile,
  } = useAuth();

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
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

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Admin
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.eyebrow}>
          ADMIN CONTROL CENTER
        </Text>

        <Text style={styles.title}>
          Muslim Ummah Admin
        </Text>

        <Text style={styles.subtitle}>
          {profile?.email}
        </Text>

        <View style={styles.adminVerified}>
          <View style={styles.verifiedIcon}>
            <Ionicons
              name="shield-checkmark"
              size={21}
              color="#D8B36A"
            />
          </View>

          <View style={styles.verifiedInfo}>
            <Text style={styles.verifiedTitle}>
              Administrator access active
            </Text>

            <Text style={styles.verifiedText}>
              Your account is verified through
              Firebase administrator permissions.
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <Stat
            icon="people-outline"
            label="Total Users"
            value="—"
          />

          <Stat
            icon="diamond-outline"
            label="Premium"
            value="—"
          />

          <Stat
            icon="pulse-outline"
            label="Active Today"
            value="—"
          />

          <Stat
            icon="time-outline"
            label="Expiring Soon"
            value="—"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Management
          </Text>

          <AdminItem
            icon="people-outline"
            title="Users"
            text="View and manage registered users"
          />

          <AdminItem
            icon="diamond-outline"
            title="Premium"
            text="Activate, extend or cancel subscriptions"
          />

          <AdminItem
            icon="card-outline"
            title="Payments"
            text="Payment records and verification"
          />

          <AdminItem
            icon="megaphone-outline"
            title="Announcements"
            text="Send announcements to users"
          />

          <AdminItem
            icon="bar-chart-outline"
            title="Analytics"
            text="Usage and feature analytics"
          />
        </View>

        <Pressable
          style={styles.bottomBackButton}
          onPress={onBack}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color="#101512"
          />

          <Text style={styles.bottomBackText}>
            Back to Profile
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons
        name={icon}
        size={22}
        color="#D8B36A"
      />

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function AdminItem({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.adminItem}>
      <View style={styles.adminIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#D8B36A"
        />
      </View>

      <View style={styles.adminInfo}>
        <Text style={styles.adminTitle}>
          {title}
        </Text>

        <Text style={styles.adminText}>
          {text}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#59616D"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080A0F',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#2A303A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    color: '#F0F0E7',
    fontSize: 17,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 42,
  },

  eyebrow: {
    color: '#D8B36A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginTop: 3,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 6,
  },

  subtitle: {
    color: '#777D89',
    fontSize: 12,
    marginTop: 5,
  },

  adminVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151912',
    borderWidth: 1,
    borderColor: '#44391F',
    borderRadius: 18,
    padding: 13,
    marginTop: 20,
  },

  verifiedIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#211F18',
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifiedInfo: {
    flex: 1,
    marginLeft: 11,
  },

  verifiedTitle: {
    color: '#E8E9E2',
    fontSize: 12,
    fontWeight: '800',
  },

  verifiedText: {
    color: '#858A80',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },

  stat: {
    width: '48%',
    minHeight: 110,
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 19,
    padding: 15,
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 13,
  },

  statLabel: {
    color: '#777D89',
    fontSize: 10,
    marginTop: 3,
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 11,
  },

  adminItem: {
    minHeight: 72,
    backgroundColor: '#11141B',
    borderWidth: 1,
    borderColor: '#242934',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  adminIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#1D1B16',
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },

  adminTitle: {
    color: '#EDEEF0',
    fontSize: 13,
    fontWeight: '700',
  },

  adminText: {
    color: '#777D89',
    fontSize: 10,
    marginTop: 4,
  },

  bottomBackButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#D8B36A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },

  bottomBackText: {
    color: '#101512',
    fontSize: 13,
    fontWeight: '800',
  },
});
