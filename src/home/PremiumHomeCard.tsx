import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../themes/ThemeProvider';
import {
  getDailyHadith,
  getLiveWeather,
  getWeatherLabel,
  type DailyHadith,
  type LiveWeather,
} from './homeDataService';
import type { PrayerData } from '../prayer/prayerService';

type Props = {
  prayerData: PrayerData | null;
  countdownSeconds: number;
  onOpenPrayer: () => void;
  onOpenHadith: () => void;
};

function formatClock(value: string): string {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PremiumPill({ label = 'PREMIUM' }: { label?: string }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.premiumPill, { backgroundColor: theme.accent }]}>
      <Ionicons name="diamond" size={10} color={theme.background} />
      <Text style={[styles.premiumPillText, { color: theme.background }]}>
        {label}
      </Text>
    </View>
  );
}

export default function PremiumHomeCard({
  prayerData,
  countdownSeconds,
  onOpenPrayer,
  onOpenHadith,
}: Props) {
  const { theme } = useTheme();
  const [hadith, setHadith] = useState<DailyHadith | null>(null);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [hadithError, setHadithError] = useState(false);

  const glow = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [float, glow]);

  useEffect(() => {
    let cancelled = false;

    getDailyHadith()
      .then((value) => {
        if (!cancelled) setHadith(value);
      })
      .catch(() => {
        if (!cancelled) setHadithError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!prayerData) {
      setWeather(null);
      return;
    }

    getLiveWeather(prayerData)
      .then((value) => {
        if (!cancelled) setWeather(value);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });

    return () => {
      cancelled = true;
    };
  }, [prayerData?.latitude, prayerData?.longitude]);

  const skyIcon = weather?.isDay ? 'sunny' : 'moon';
  const skyLabel = weather
    ? getWeatherLabel(weather.weatherCode)
    : 'Live sky';

  const nextPrayer = useMemo(() => {
    if (!prayerData) return null;

    const prayers = prayerData.prayers.filter(
      (item) => item.key !== 'Sunrise'
    );

    return prayers.find((item) => {
      const [hour, minute] = item.time
        .replace(/\s?(AM|PM)$/i, '')
        .split(':')
        .map(Number);

      const isPm = /PM$/i.test(item.time);
      const normalizedHour =
        isPm && hour !== 12 ? hour + 12 : !isPm && hour === 12 ? 0 : hour;

      const now = new Date();
      return normalizedHour * 60 + minute >
        now.getHours() * 60 + now.getMinutes();
    }) || prayers[0] || null;
  }, [prayerData]);

  const orbitTranslate = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.22],
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.borderStrong,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: theme.glow,
            opacity: glowOpacity,
          },
        ]}
      />

      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: theme.accentSoft },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={theme.accent}
            />
          </View>
          <View>
            <Text style={[styles.kicker, { color: theme.textSecondary }]}>
              TODAY'S REMINDER
            </Text>
            <Text style={[styles.subKicker, { color: theme.textMuted }]}>
              Curated for your day
            </Text>
          </View>
        </View>
        <PremiumPill />
      </View>

      {hadith ? (
        <Pressable onPress={onOpenHadith} style={styles.hadithBlock}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=85',
            }}
            imageStyle={styles.hadithImage}
            style={styles.hadithImageWrap}
          >
            <View style={styles.hadithImageOverlay} />
            <View style={styles.hadithImageContent}>
              <Text style={styles.hadithImageKicker}>DAILY HADITH</Text>
              <Ionicons name="book-outline" size={18} color="#FFFFFF" />
            </View>
          </ImageBackground>
          <Text style={[styles.hadithLabel, { color: theme.accent }]}>
            DAILY HADITH • ROMAN URDU
          </Text>
          <Text
            numberOfLines={6}
            style={[styles.hadithText, { color: theme.text }]}
          >
            “{hadith.romanUrdu}”
          </Text>
          <Text style={[styles.reference, { color: theme.textSecondary }]}>
            {hadith.reference}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.hadithBlock}>
          <Text style={[styles.hadithLabel, { color: theme.accent }]}>
            DAILY HADITH
          </Text>
          <Text style={[styles.loading, { color: theme.textMuted }]}>
            {hadithError
              ? 'Today’s reminder is temporarily unavailable.'
              : 'Loading today’s Hadith…'}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.liveStrip,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.skyOrb,
            {
              backgroundColor: weather?.isDay
                ? theme.accent
                : theme.accentSoft,
              transform: [{ translateY: orbitTranslate }],
            },
          ]}
        >
          <Ionicons
            name={skyIcon}
            size={24}
            color={weather?.isDay ? theme.background : theme.accent}
          />
        </Animated.View>

        <View style={styles.weatherInfo}>
          <Text style={[styles.liveLabel, { color: theme.textMuted }]}>
            LIVE SKY • {skyLabel.toUpperCase()}
          </Text>
          <Text style={[styles.weatherTemp, { color: theme.text }]}>
            {weather ? `${Math.round(weather.temperature)}°C` : '--°'}
          </Text>
          <Text style={[styles.weatherMeta, { color: theme.textSecondary }]}>
            {weather
              ? `Feels ${Math.round(weather.apparentTemperature)}° • ${Math.round(weather.humidity)}% humidity`
              : 'Weather loading…'}
          </Text>
        </View>

        <View style={styles.sunTimes}>
          <Text style={[styles.sunTimeLabel, { color: theme.textMuted }]}>
            SUN
          </Text>
          <Text style={[styles.sunTime, { color: theme.text }]}>
            ↑ {formatClock(weather?.sunrise || '')}
          </Text>
          <Text style={[styles.sunTime, { color: theme.textSecondary }]}>
            ↓ {formatClock(weather?.sunset || '')}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpenPrayer}
        style={[
          styles.nextPrayer,
          {
            backgroundColor: theme.accentSoft,
            borderColor: theme.accent,
          },
        ]}
      >
        <View style={styles.nextPrayerText}>
          <Text style={[styles.liveLabel, { color: theme.textMuted }]}>
            NEXT PRAYER
          </Text>
          <Text style={[styles.nextPrayerName, { color: theme.text }]}>
            {nextPrayer?.name || '--'}
          </Text>
          <Text style={[styles.nextPrayerTime, { color: theme.accent }]}>
            {nextPrayer?.time || '--:--'} • {formatCountdown(countdownSeconds)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  premiumPill: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  premiumPillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  card: {
    minHeight: 410,
    marginBottom: 2,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -90,
    top: -80,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  subKicker: {
    fontSize: 9,
    marginTop: 2,
  },
  hadithBlock: {
    marginTop: 18,
    borderRadius: 22,
    overflow: 'hidden',
  },
  hadithImageWrap: {
    height: 145,
    marginBottom: 14,
    justifyContent: 'flex-end',
  },
  hadithImage: {
    borderRadius: 22,
  },
  hadithImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  hadithImageContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  hadithImageKicker: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  hadithLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  hadithText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    marginTop: 9,
  },
  reference: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 9,
  },
  loading: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  liveStrip: {
    marginTop: 17,
    borderRadius: 21,
    borderWidth: 1,
    minHeight: 96,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skyOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  liveLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  weatherTemp: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
  weatherMeta: {
    fontSize: 8,
    marginTop: 3,
  },
  sunTimes: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  sunTimeLabel: {
    fontSize: 7,
    fontWeight: '900',
    marginBottom: 3,
  },
  sunTime: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  nextPrayer: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPrayerText: {
    flex: 1,
  },
  nextPrayerName: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  nextPrayerTime: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
