import {
  doc,
  getDocFromServer,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

import { firebaseApp } from '../firebase/firebaseConfig';
import type { PremiumSubscription } from './premiumTypes';

const db = getFirestore(firebaseApp);

const premiumCollection = 'premiumSubscriptions';

/**
 * Premium entitlement is intentionally server-authoritative.
 *
 * We do NOT use Firestore's offline cache for entitlement checks. A premium
 * subscription must be verified against Firestore while the device is online.
 * If the network is unavailable, the caller receives an error and Premium
 * must remain locked.
 */
export async function getPremiumSubscription(
  uid: string
): Promise<PremiumSubscription | null> {
  const subscriptionRef = doc(
    db,
    premiumCollection,
    uid
  );

  const snapshot = await getDocFromServer(
    subscriptionRef
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as PremiumSubscription;
}

/**
 * Administrative/backend subscription writes remain available for the
 * existing admin flow. Production Firestore security rules should restrict
 * this collection so normal users cannot write their own entitlement.
 */
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
