import React from 'react';

import {
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

export default function AdminDashboard() {
  const {
    profile,
  } = useAuth();

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <Text style={styles.eyebrow}>
          ADMIN CONTROL CENTER
        </Text>

        <Text style={styles.title}>
          Muslim Ummah Admin
        </Text>

        <Text style={styles.subtitle}>
          {profile?.email}
        </Text>

        <View style={styles.warning}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color="#D8B36A"
          />

          <Text style={styles.warningText}>
            Admin security will be upgraded to
            server-side custom claims before
            production release.
          </Text>
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

  eyebrow: {
    color: '#D8B36A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginTop: 15,
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

  warning: {
    flexDirection: 'row',
    backgroundColor: '#1B1811',
    borderWidth: 1,
    borderColor: '#44391F',
    borderRadius: 18,
    padding: 13,
    marginTop: 20,
  },

  warningText: {
    flex: 1,
    color: '#B7AA8C',
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 9,
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
});
