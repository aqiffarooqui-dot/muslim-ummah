import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { firebaseApp } from './firebaseConfig';

export const db = getFirestore(firebaseApp);

export type FirestoreUserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  lastActiveAt: string;
};

const usersCollection = 'users';

export async function createUserProfile(
  profile: FirestoreUserProfile
): Promise<void> {
  const userRef = doc(db, usersCollection, profile.uid);

  await setDoc(userRef, profile, {
    merge: true,
  });
}

export async function getUserProfile(
  uid: string
): Promise<FirestoreUserProfile | null> {
  const userRef = doc(db, usersCollection, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FirestoreUserProfile;
}

export async function updateUserLastActive(
  uid: string
): Promise<void> {
  const userRef = doc(db, usersCollection, uid);

  await updateDoc(userRef, {
    lastActiveAt: new Date().toISOString(),
  });
}
