import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_VERSION = '1.0.3';
const UPDATE_URL =
  'https://aqiffarooqui-dot.github.io/muslim-ummah/update.json';
const DISMISSED_KEY = 'muslim_ummah_update_dismissed';

type UpdateInfo = {
  version: string;
  title?: string;
  changes?: string[];
  mandatory?: boolean;
  apkUrl?: string;
};

function isNewerVersion(remote: string, current: string) {
  const a = remote.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return av > bv;
  }
  return false;
}

export default function UpdateNotice() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const response = await fetch(UPDATE_URL, {
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = (await response.json()) as UpdateInfo;
        if (!data?.version || !isNewerVersion(data.version, CURRENT_VERSION)) {
          return;
        }

        const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
        if (dismissed === data.version && !data.mandatory) return;

        if (mounted) {
          setUpdate(data);
          setVisible(true);
        }
      } catch {
        // Update checks are non-blocking and should never affect app startup.
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  if (!update) return null;

  const close = async () => {
    if (!update.mandatory) {
      await AsyncStorage.setItem(DISMISSED_KEY, update.version);
      setVisible(false);
    }
  };

  const updateNow = async () => {
    if (update.apkUrl) {
      await Linking.openURL(update.apkUrl);
      return;
    }

    await close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>↗</Text>
          </View>

          <Text style={styles.title}>New Update Available</Text>

          <Text style={styles.version}>
            Version {update.version}
          </Text>

          <Text style={styles.subtitle}>
            {update.title || 'Muslim Ummah has been updated.'}
          </Text>

          {!!update.changes?.length && (
            <View style={styles.changes}>
              <Text style={styles.changesTitle}>What’s New</Text>
              {update.changes.map((change, index) => (
                <View style={styles.changeRow} key={index}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.updateButton} onPress={updateNow}>
            <Text style={styles.updateButtonText}>
              {update.apkUrl ? 'Update Now' : 'Got It'}
            </Text>
          </Pressable>

          {!update.mandatory && (
            <Pressable style={styles.laterButton} onPress={close}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#101827',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(212,175,55,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    color: '#D4AF37',
    fontSize: 25,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  version: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  subtitle: {
    color: '#AEB8C8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  changes: {
    marginTop: 18,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#172235',
  },
  changesTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 9,
  },
  changeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bullet: {
    color: '#D4AF37',
    fontSize: 18,
    lineHeight: 20,
    width: 18,
  },
  changeText: {
    flex: 1,
    color: '#D7DFEA',
    fontSize: 13,
    lineHeight: 20,
  },
  updateButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  laterButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    color: '#9AA7BA',
    fontSize: 14,
    fontWeight: '600',
  },
});
