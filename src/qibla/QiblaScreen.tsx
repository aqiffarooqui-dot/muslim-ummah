import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../themes/ThemeProvider';

const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function normalizeDegrees(value: number) {
  return (value + 360) % 360;
}

function getQiblaBearing(latitude: number, longitude: number) {
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_LAT);
  const deltaLon = toRadians(KAABA_LON - longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

function getDistanceKm(latitude: number, longitude: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(KAABA_LAT - latitude);
  const dLon = toRadians(KAABA_LON - longitude);
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_LAT);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAccuracyLabel(accuracy: number) {
  if (accuracy >= 3) return 'High';
  if (accuracy === 2) return 'Medium';
  if (accuracy === 1) return 'Low';
  return 'Needs calibration';
}

export default function QiblaScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState(0);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const animatedHeading = useRef(new Animated.Value(0)).current;
  const previousHeading = useRef(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription | null = null;
    let mounted = true;

    async function start() {
      try {
        setLoading(true);
        setError('');

        const permission = await Location.requestForegroundPermissionsAsync();

        if (!mounted) return;

        if (permission.status !== 'granted') {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) return;

        setLocation(currentLocation);

        if (Platform.OS === 'web') {
          setSensorAvailable(false);
          setLoading(false);
          return;
        }

        headingSubscription = await Location.watchHeadingAsync((nextHeading) => {
          if (!mounted) return;

          const trueHeading =
            nextHeading.trueHeading >= 0
              ? nextHeading.trueHeading
              : nextHeading.magHeading;

          const next = normalizeDegrees(trueHeading);
          const previous = previousHeading.current;
          let delta = next - previous;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          previousHeading.current = next;
          setHeading(next);
          Animated.timing(animatedHeading, { toValue: previous + delta, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
          setHeadingAccuracy(nextHeading.accuracy);
          setSensorAvailable(true);
          setLoading(false);
        });

        if (!headingSubscription && mounted) {
          setSensorAvailable(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Qibla initialization error:', err);

        if (mounted) {
          setError('Unable to access location or compass. Please try again.');
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      mounted = false;
      headingSubscription?.remove();
    };
  }, [retryNonce, animatedHeading]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const qiblaBearing = useMemo(() => {
    if (!location) return 0;

    return getQiblaBearing(
      location.coords.latitude,
      location.coords.longitude
    );
  }, [location]);

  const distanceKm = useMemo(() => {
    if (!location) return 0;

    return getDistanceKm(
      location.coords.latitude,
      location.coords.longitude
    );
  }, [location]);

  const relativeAngle = normalizeDegrees(qiblaBearing - heading);
  const accuracyLabel = getAccuracyLabel(headingAccuracy);
  const compassRotation = animatedHeading.interpolate({ inputRange: [-720, 0, 720], outputRange: ['720deg', '0deg', '-720deg'] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons
            name="arrow-back"
            size={21}
            color={theme.textSecondary}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.eyebrow}>ISLAMIC TOOLS</Text>
          <Text style={styles.title}>Qibla Compass</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="compass-outline"
            size={22}
            color={theme.accent}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.stateTitle}>Finding Qibla direction</Text>
          <Text style={styles.stateText}>
            Allow location access and keep your phone away from magnetic objects.
          </Text>
        </View>
      ) : permissionDenied ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="location-outline"
              size={32}
              color={theme.accent}
            />
          </View>
          <Text style={styles.stateTitle}>Location permission required</Text>
          <Text style={styles.stateText}>
            Qibla direction needs your approximate current location to calculate
            the bearing to the Kaaba.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setPermissionDenied(false);
              setLoading(true);
              setError('');
              Location.requestForegroundPermissionsAsync().catch(() => {});
            }}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <View style={styles.stateIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={theme.accent}
            />
          </View>
          <Text style={styles.stateTitle}>Compass unavailable</Text>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>FACE TOWARD</Text>
                <Text style={styles.heroTitle}>The Kaaba</Text>
              </View>

              <View style={styles.accuracyBadge}>
                <View style={styles.accuracyDot} />
                <Text style={styles.accuracyText}>{accuracyLabel}</Text>
              </View>
            </View>

            <View style={styles.compassWrap}>
              <View style={styles.compassOuter}>
                <Animated.View style={[styles.compassInner, { transform: [{ rotate: compassRotation }] }]}>
                  <View style={styles.northMark}>
                    <Text style={styles.northText}>N</Text>
                  </View>
                  <Text style={[styles.directionText, styles.east]}>E</Text>
                  <Text style={[styles.directionText, styles.south]}>S</Text>
                  <Text style={[styles.directionText, styles.west]}>W</Text>

                  <View
                    style={[
                      styles.qiblaArrow,
                      {
                        transform: [{ rotate: `${qiblaBearing}deg` }],
                      },
                    ]}
                  >
                    <View style={styles.arrowTip} />
                    <View style={styles.arrowStem} />
                    <View style={styles.arrowBase} />
                  </View>

                  <Animated.View style={[styles.pulseRing, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />

                  <View style={styles.centerDot}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={theme.background}
                    />
                  </View>
                </Animated.View>
              </View>

              <Text style={styles.bearing}>
                {Math.round(qiblaBearing)}°
              </Text>
              <Text style={styles.bearingLabel}>QIBLA BEARING</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="navigate-outline"
                  size={19}
                  color={theme.accent}
                />
              </View>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>
                {distanceKm >= 1000
                  ? `${(distanceKm / 1000).toFixed(1)}k km`
                  : `${Math.round(distanceKm)} km`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons
                  name="compass-outline"
                  size={19}
                  color={theme.accent}
                />
              </View>
              <Text style={styles.statLabel}>HEADING</Text>
              <Text style={styles.statValue}>{Math.round(heading)}°</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.accent}
              />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Compass tip</Text>
              <Text style={styles.tipText}>
                For better accuracy, move your phone in a gentle figure-eight
                motion and keep it away from magnets, speakers and metal.
              </Text>
            </View>
          </View>

          {!sensorAvailable && (
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={theme.accent}
                />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Live compass unavailable</Text>
                <Text style={styles.tipText}>
                  This device or web preview does not expose a live heading
                  sensor. The calculated Qibla bearing is still shown above.
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 52,
      paddingHorizontal: 18,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    backButton: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      marginLeft: 13,
    },
    eyebrow: {
      color: theme.textMuted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.7,
    },
    title: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '700',
      marginTop: 3,
    },
    headerIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      borderRadius: 27,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      padding: 18,
      minHeight: 465,
      overflow: 'hidden',
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroLabel: {
      color: theme.textMuted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 4,
    },
    accuracyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 13,
    },
    accuracyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    accuracyText: {
      color: theme.accent,
      fontSize: 9,
      fontWeight: '800',
    },
    compassWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 4,
    },
    compassOuter: {
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compassInner: {
      width: 244,
      height: 244,
      borderRadius: 122,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    pulseRing: {
      position: 'absolute', width: 66, height: 66, borderRadius: 33,
      borderWidth: 2, borderColor: theme.accent,
    },
    northMark: {
      position: 'absolute',
      top: 14,
      alignItems: 'center',
    },
    northText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '900',
    },
    directionText: {
      position: 'absolute',
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '800',
    },
    east: {
      right: 17,
    },
    south: {
      bottom: 14,
    },
    west: {
      left: 17,
    },
    qiblaArrow: {
      width: 8,
      height: 180,
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'absolute',
    },
    arrowTip: {
      width: 0,
      height: 0,
      borderLeftWidth: 9,
      borderRightWidth: 9,
      borderBottomWidth: 22,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.accent,
    },
    arrowStem: {
      width: 4,
      height: 120,
      backgroundColor: theme.accent,
    },
    arrowBase: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.accent,
      marginTop: 3,
    },
    centerDot: {
      position: 'absolute',
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bearing: {
      color: theme.text,
      fontSize: 27,
      fontWeight: '800',
      marginTop: 13,
    },
    bearingLabel: {
      color: theme.textMuted,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 1.5,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 11,
    },
    statCard: {
      flex: 1,
      minHeight: 105,
      borderRadius: 19,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13,
    },
    statIcon: {
      width: 35,
      height: 35,
      borderRadius: 12,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginTop: 9,
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 3,
    },
    tipCard: {
      flexDirection: 'row',
      borderRadius: 19,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginTop: 11,
      marginBottom: 10,
    },
    tipIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipContent: {
      flex: 1,
      marginLeft: 11,
    },
    tipTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
    },
    tipText: {
      color: theme.textMuted,
      fontSize: 9,
      lineHeight: 15,
      marginTop: 4,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
      paddingBottom: 70,
    },
    stateIcon: {
      width: 70,
      height: 70,
      borderRadius: 24,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    stateTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    stateText: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 19,
      textAlign: 'center',
      marginTop: 8,
      maxWidth: 330,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 18,
      paddingHorizontal: 20,
      paddingVertical: 11,
      marginTop: 20,
    },
    primaryButtonText: {
      color: theme.background,
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
