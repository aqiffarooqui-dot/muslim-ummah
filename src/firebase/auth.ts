import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';

import { firebaseApp } from './firebaseConfig';

let auth;

try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(
      AsyncStorage
    ),
  });
} catch {
  auth = getAuth(firebaseApp);
}

export { auth };

export async function registerWithEmail(
  email: string,
  password: string
): Promise<User> {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

  return credential.user;
}

export async function resetPassword(
  email: string
): Promise<void> {
  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase()
  );
}

export function subscribeToAuth(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}
