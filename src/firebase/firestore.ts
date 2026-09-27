import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
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
  const userRef = doc(
    db,
    usersCollection,
    profile.uid
  );

  await setDoc(
    userRef,
    profile,
    {
      merge: true,
    }
  );
}

export async function getUserProfile(
  uid: string
): Promise<FirestoreUserProfile | null> {
  const userRef = doc(
    db,
    usersCollection,
    uid
  );

  const snapshot =
    await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FirestoreUserProfile;
}

export async function updateUserLastActive(
  uid: string
): Promise<void> {
  const userRef = doc(
    db,
    usersCollection,
    uid
  );

  await updateDoc(
    userRef,
    {
      lastActiveAt:
        new Date().toISOString(),
    }
  );
}

export async function getAllUserProfiles(): Promise<
  FirestoreUserProfile[]
> {
  const usersRef =
    collection(
      db,
      usersCollection
    );

  const usersQuery = query(
    usersRef,
    orderBy(
      'createdAt',
      'desc'
    )
  );

  const snapshot =
    await getDocs(usersQuery);

  return snapshot.docs.map(
    (userDoc) =>
      userDoc.data() as FirestoreUserProfile
  );
}

export async function getUserCount(): Promise<number> {
  const usersRef =
    collection(
      db,
      usersCollection
    );

  const snapshot =
    await getDocs(usersRef);

  return snapshot.size;
}

export async function getActiveUserCount(
  hours = 24
): Promise<number> {
  const users =
    await getAllUserProfiles();

  const cutoff =
    Date.now() -
    hours * 60 * 60 * 1000;

  return users.filter(
    (user) => {
      const lastActive =
        new Date(
          user.lastActiveAt
        ).getTime();

      return (
        Number.isFinite(
          lastActive
        ) &&
        lastActive >= cutoff
      );
    }
  ).length;
}

export async function getAdminUserCount(): Promise<number> {
  const users =
    await getAllUserProfiles();

  return users.filter(
    (user) =>
      user.role === 'admin'
  ).length;
}
