import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { usePremium } from './premium/PremiumProvider';
import { useTheme } from './themes/ThemeProvider';
import {
  formatCountdown,
  getNextPrayer,
  getTodayPrayerData,
  type PrayerData,
} from './prayer/prayerService';
import {
  getPrayerSettings,
  PRAYER_METHODS,
  savePrayerSettings,
  type PrayerSettings,
} from './prayer/prayerSettings';
import {
  getPrayerNotificationSettings,
  PRAYER_NOTIFICATION_KEYS,
  savePrayerNotificationSettings,
  type PrayerNotificationSettings,
} from './prayer/prayerNotificationSettings';
import {
  cancelPrayerNotifications,
  getScheduledPrayerNotificationCount,
  schedulePrayerNotifications,
} from './prayer/prayerNotificationService';

export default function PrayerScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const styles = createStyles(theme);

  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<PrayerSettings>({ method: 1, school: 1 });
  const [notifications, setNotifications] = useState<PrayerNotificationSettings>({
    enabled: false,
    prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  });
  const [scheduledCount, setScheduledCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setPrayerData(await getTodayPrayerData());
    } catch (err) {
      setPrayerData(null);
      setError(err instanceof Error ? err.message : 'Location access is required to calculate prayer times.');
    }

    if (isPremium) {
      setSettings(await getPrayerSettings());
      setNotifications(await getPrayerNotificationSettings());
      setScheduledCount(await getScheduledPrayerNotificationCount());
    }
  }, [isPremium]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!prayerData) return;
    const tick = () => setCountdown(getNextPrayer(prayerData.prayers, new Date())?.remainingSeconds ?? 0);
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [prayerData]);

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(title + '\n\n' + message);
    else Alert.alert(title, message);
  };

  const updatePrayerSettings = async (next: PrayerSettings, message: string) => {
    try {
      setBusy(true);
      await savePrayerSettings(next);
      setSettings(next);
      setPrayerData(await getTodayPrayerData());
      notify('Prayer Settings', message);
    } catch (err) {
      notify('Unable to update', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleAllNotifications = async () => {
    const enabled = !notifications.enabled;
    try {
      setBusy(true);
      const next = { ...notifications, enabled };
      await savePrayerNotificationSettings(next);
      if (enabled) await schedulePrayerNotifications(next);
      else await cancelPrayerNotifications();
      setNotifications(next);
      setScheduledCount(await getScheduledPrayerNotificationCount());
    } catch (err) {
      notify('Prayer Notifications', err instanceof Error ? err.message : 'Unable to update notifications.');
    } finally {
      setBusy(false);
    }
  };

  const togglePrayerNotification = async (key: (typeof PRAYER_NOTIFICATION_KEYS)[number]) => {
    const next = {
      ...notifications,
      prayers: { ...notifications.prayers, [key]: !notifications.prayers[key] },
    };
    try {
      setBusy(true);
      await savePrayerNotificationSettings(next);
      if (next.enabled) await schedulePrayerNotifications(next);
      setNotifications(next);
      setScheduledCount(await getScheduledPrayerNotificationCount());
    } catch (err) {
      notify('Prayer Notifications', err instanceof Error ? err.message : 'Unable to update notifications.');
    } finally {
      setBusy(false);
    }
  };

  const nextPrayer = prayerData ? getNextPrayer(prayerData.prayers, new Date()) : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={theme.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.eyebrow}>SALAH</Text>
            <Text style={styles.title}>Prayer Times</Text>
            <Text style={styles.subtitle}>Daily prayer timings for your current location</Text>
          </View>
          <Pressable onPress={load} style={styles.refresh}>
            <Ionicons name="refresh-outline" size={20} color={theme.accent} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="location-outline" size={24} color={theme.accent} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Location unavailable</Text>
              <Text style={styles.text}>{error}</Text>
              <View style={styles.row}>
                <Pressable onPress={load} style={styles.action}><Text style={styles.actionText}>Retry</Text></Pressable>
                <Pressable onPress={() => Linking.openSettings()} style={styles.secondaryAction}><Text style={styles.secondaryText}>Open Settings</Text></Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}><Ionicons name="location" size={20} color={theme.accent} /></View>
          <View style={styles.flex}>
            <Text style={styles.locationTitle}>{prayerData?.city || 'Current location'}</Text>
            <Text style={styles.text}>
              {(prayerData?.country || 'Loading location') +
                (prayerData?.hijriDate ? ' • ' + prayerData.hijriDate : '')}
            </Text>
          </View>
        </View>

        <View style={styles.nextCard}>
          <View>
            <Text style={styles.overline}>NEXT PRAYER</Text>
            <Text style={styles.nextName}>{nextPrayer?.name || 'Loading...'}</Text>
            <Text style={styles.nextTime}>{nextPrayer?.time || '--:--'}</Text>
          </View>
          <View style={styles.countdownBox}>
            <Text style={styles.overline}>STARTS IN</Text>
            <Text style={styles.countdown}>{formatCountdown(countdown)}</Text>
          </View>
        </View>

        <Text style={styles.section}>Today's Prayers</Text>
        <View style={styles.prayerList}>
          {(prayerData?.prayers || []).filter(p => p.key !== 'Sunrise').map(prayer => {
            const isNext = nextPrayer?.key === prayer.key;
            const icon =
              prayer.key === 'Fajr' ? 'sunny-outline' :
              prayer.key === 'Dhuhr' ? 'sunny' :
              prayer.key === 'Asr' ? 'partly-sunny-outline' :
              prayer.key === 'Maghrib' ? 'moon-outline' : 'moon';
            return (
              <View key={prayer.key} style={[styles.prayerRow, isNext && styles.prayerRowNext]}>
                <View style={styles.prayerIcon}><Ionicons name={icon} size={21} color={isNext ? theme.accent : theme.textSecondary} /></View>
                <View style={styles.flex}>
                  <Text style={[styles.prayerName, isNext && styles.accentText]}>{prayer.name}</Text>
                  {isNext ? <Text style={styles.nextLabel}>NEXT</Text> : null}
                </View>
                <Text style={[styles.prayerTime, isNext && styles.accentText]}>{prayer.time}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sunriseCard}>
          <Ionicons name="sunny-outline" size={19} color={theme.textSecondary} />
          <Text style={styles.sunriseText}>Sunrise</Text>
          <Text style={styles.sunriseTime}>{prayerData?.prayers.find(p => p.key === 'Sunrise')?.time || '--:--'}</Text>
        </View>

        {isPremium ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.section}>Premium Prayer Tools</Text>
              <View style={styles.premiumBadge}><Ionicons name="diamond" size={11} color={theme.background} /><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>
            </View>

            <View style={styles.premiumCard}>
              <View style={styles.cardTop}>
                <View style={styles.locationIcon}><Ionicons name="options-outline" size={21} color={theme.accent} /></View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Calculation Method</Text>
                  <Text style={styles.text}>{PRAYER_METHODS.find(x => x.id === settings.method)?.name || 'Selected method'}</Text>
                </View>
                <View style={styles.miniPremium}><Text style={styles.miniPremiumText}>PREMIUM</Text></View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.options}>
                  {PRAYER_METHODS.map(method => (
                    <Pressable key={method.id} disabled={busy} onPress={() => updatePrayerSettings({ ...settings, method: method.id }, 'Prayer calculation method saved.')} style={[styles.option, settings.method === method.id && styles.optionActive]}>
                      <Text style={[styles.optionText, settings.method === method.id && styles.optionTextActive]}>{method.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.controlLabel}>Asr Calculation School</Text>
              <View style={styles.row}>
                {[{ id: 0 as const, label: "Standard / Shafi'i" }, { id: 1 as const, label: 'Hanafi' }].map(option => (
                  <Pressable key={option.id} disabled={busy} onPress={() => updatePrayerSettings({ ...settings, school: option.id }, 'Asr calculation school saved.')} style={[styles.schoolButton, settings.school === option.id && styles.optionActive]}>
                    <Text style={[styles.optionText, settings.school === option.id && styles.optionTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.premiumCard}>
              <View style={styles.cardTop}>
                <View style={styles.locationIcon}><Ionicons name="notifications-outline" size={21} color={theme.accent} /></View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Prayer Notifications</Text>
                  <Text style={styles.text}>{scheduledCount} scheduled notification(s)</Text>
                </View>
                <View style={styles.miniPremium}><Text style={styles.miniPremiumText}>PREMIUM</Text></View>
              </View>

              <Pressable disabled={busy} onPress={toggleAllNotifications} style={[styles.toggle, notifications.enabled && styles.toggleActive]}>
                <Text style={styles.toggleText}>{notifications.enabled ? 'Enabled — 7-Day Schedule' : 'Enable 7-Day Notifications'}</Text>
              </Pressable>

              <Text style={styles.controlLabel}>Individual prayers</Text>
              <View style={styles.notificationGrid}>
                {PRAYER_NOTIFICATION_KEYS.map(key => (
                  <Pressable key={key} disabled={busy || !notifications.enabled} onPress={() => togglePrayerNotification(key)} style={[styles.notificationButton, notifications.prayers[key] && notifications.enabled && styles.optionActive, (!notifications.enabled || busy) && styles.disabled]}>
                    <Ionicons name={notifications.prayers[key] ? 'notifications' : 'notifications-off-outline'} size={16} color={notifications.prayers[key] && notifications.enabled ? theme.accent : theme.textMuted} />
                    <Text style={[styles.notificationText, notifications.prayers[key] && notifications.enabled && styles.optionTextActive]}>{key}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.text}>Notifications use device local time and require a native Android/iOS build.</Text>
            </View>
          </>
        ) : null}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={19} color={theme.accent} />
          <Text style={styles.text}>Normal prayer times are available to everyone. Calculation controls and prayer notifications appear only with Premium.</Text>
        </View>
        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 18, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    back: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
    refresh: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
    title: { color: theme.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 2 },
    subtitle: { color: theme.textSecondary, fontSize: 10, marginTop: 3 },
    errorCard: { padding: 14, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, marginBottom: 10 },
    locationCard: { padding: 15, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 12, alignItems: 'center' },
    locationIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    locationTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: '900' },
    cardTitle: { color: theme.textPrimary, fontSize: 13, fontWeight: '900' },
    text: { color: theme.textSecondary, fontSize: 10, lineHeight: 16, marginTop: 3 },
    row: { flexDirection: 'row', gap: 8, marginTop: 10 },
    action: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accent, alignItems: 'center' },
    actionText: { color: theme.accent, fontSize: 10, fontWeight: '900' },
    secondaryAction: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
    secondaryText: { color: theme.textPrimary, fontSize: 10, fontWeight: '800' },
    nextCard: { marginTop: 10, padding: 18, borderRadius: 20, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    overline: { color: theme.textMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    nextName: { color: theme.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 5 },
    nextTime: { color: theme.accent, fontSize: 16, fontWeight: '900', marginTop: 3 },
    countdownBox: { padding: 11, borderRadius: 15, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
    countdown: { color: theme.accent, fontSize: 16, fontWeight: '900', marginTop: 4 },
    section: { color: theme.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 20, marginBottom: 9 },
    prayerList: { gap: 8 },
    prayerRow: { padding: 13, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 11 },
    prayerRowNext: { borderColor: theme.accent },
    prayerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    prayerName: { color: theme.textPrimary, fontSize: 13, fontWeight: '800' },
    prayerTime: { color: theme.textPrimary, fontSize: 14, fontWeight: '900' },
    nextLabel: { color: theme.accent, fontSize: 8, fontWeight: '900', marginTop: 2 },
    accentText: { color: theme.accent },
    sunriseCard: { marginTop: 8, padding: 12, borderRadius: 15, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 9 },
    sunriseText: { flex: 1, color: theme.textSecondary, fontSize: 11, fontWeight: '800' },
    sunriseTime: { color: theme.textPrimary, fontSize: 12, fontWeight: '900' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    premiumBadge: { marginTop: 20, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', gap: 4 },
    premiumBadgeText: { color: theme.background, fontSize: 8, fontWeight: '900' },
    premiumCard: { marginTop: 8, padding: 15, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent, gap: 11 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    miniPremium: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 7, backgroundColor: theme.accentSoft },
    miniPremiumText: { color: theme.accent, fontSize: 7, fontWeight: '900' },
    options: { flexDirection: 'row', gap: 8, paddingRight: 10 },
    option: { maxWidth: 220, padding: 10, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
    optionActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
    optionText: { color: theme.textSecondary, fontSize: 9, fontWeight: '800' },
    optionTextActive: { color: theme.accent },
    controlLabel: { color: theme.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
    schoolButton: { flex: 1, padding: 11, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
    toggle: { padding: 12, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
    toggleActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
    toggleText: { color: theme.textPrimary, fontSize: 10, fontWeight: '900' },
    notificationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    notificationButton: { width: '31%', minHeight: 46, padding: 8, borderRadius: 12, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
    notificationText: { color: theme.textSecondary, fontSize: 9, fontWeight: '800' },
    disabled: { opacity: 0.45 },
    infoCard: { marginTop: 18, padding: 13, borderRadius: 15, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  });
}
