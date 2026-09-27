import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

import { firebaseApp } from '../firebase/firebaseConfig';
import type { PremiumSubscription } from './premiumTypes';

const db = getFirestore(firebaseApp);

const premiumCollection = 'premiumSubscriptions';

export async function getPremiumSubscription(
  uid: string
): Promise<PremiumSubscription | null> {
  const subscriptionRef = doc(
    db,
    premiumCollection,
    uid
  );

  const snapshot = await getDoc(subscriptionRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as PremiumSubscription;
}

export async function savePremiumSubscription(
  subscription: PremiumSubscription
): Promise<void> {
  const subscriptionRef = doc(
    db,
    premiumCollection,
    subscription.userId
  );

  await setDoc(subscriptionRef, subscription, {
    merge: true,
  });
}
